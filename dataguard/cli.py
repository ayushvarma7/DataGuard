"""DataGuard CLI - Data Quality Framework"""

import typer
import os
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from dataguard.core.schema import SchemaInferer
from dataguard.storage.metadata import MetadataStore
from dataguard.storage.models import Dataset
from dataguard.core.drift import DriftDetector
from dataguard.core.validator import RuleParser, ValidationExecutor

app = typer.Typer(
    name="dataguard",
    help="🛡️ DataGuard - Data Quality Framework with Lineage Tracking",
    add_completion=False,
)
console = Console()

# Initialize store (in a real app, path might be configurable via env var)
STORE_PATH = "dataguard.db"

# Schema subcommand group
schema_app = typer.Typer(help="Schema operations")
app.add_typer(schema_app, name="schema")


def get_store() -> MetadataStore:
    """Get metadata store instance."""
    return MetadataStore(STORE_PATH)


@app.command()
def version():
    """Show DataGuard version."""
    console.print("[bold green]DataGuard[/bold green] v0.1.0")


@schema_app.command("infer")
def schema_infer(
    file_path: str = typer.Argument(..., help="Path to data file (CSV/Parquet)"),
    name: str = typer.Option(..., "--name", "-n", help="Dataset name"),
):
    """Infer and store schema from a data file."""
    path = Path(file_path).resolve()
    if not path.exists():
        console.print(f"[bold red]Error:[/bold red] File not found: {path}")
        raise typer.Exit(code=1)

    console.print(f"🔍 Inferring schema for [cyan]{name}[/cyan] from {path.name}...")

    # 1. Infer Schema
    inferer = SchemaInferer()
    try:
        schema = inferer.infer(str(path), name)
    finally:
        inferer.close()

    # 2. Register Dataset & Save Schema
    store = get_store()
    
    # Register dataset if new
    dataset = Dataset(
        name=name,
        file_path=str(path),
        format=path.suffix.lstrip('.')
    )
    store.register_dataset(dataset)
    
    # Save snapshot
    store.save_schema_snapshot(name, schema)
    
    console.print(f"[green]✅ Schema inferred and saved for dataset:[/green] [bold]{name}[/bold]")
    console.print(f"   Columns detected: {len(schema.columns)}")


@schema_app.command("show")
def schema_show(
    name: str = typer.Argument(..., help="Dataset name"),
):
    """Show current schema for a dataset."""
    store = get_store()
    schema = store.get_latest_schema(name)
    
    if not schema:
        console.print(f"[bold red]Error:[/bold red] No schema found for dataset '{name}'")
        raise typer.Exit(code=1)

    table = Table(title=f"Schema: {name}")
    table.add_column("Column", style="cyan")
    table.add_column("Type", style="green")
    table.add_column("Nullable", justify="center")

    for col in schema.columns:
        table.add_row(
            col.name, 
            col.dtype, 
            "Yes" if col.nullable else "No"
        )

    console.print(table)


@schema_app.command("diff")
def schema_diff(
    name: str = typer.Argument(..., help="Dataset name (baseline)"),
    file_path: str = typer.Option(None, "--file", "-f", help="New file to compare against"),
):
    """Check for schema drift."""
    if not file_path:
        console.print("[yellow]Please provide a file to check drift against: --file <path>[/yellow]")
        raise typer.Exit(code=1)

    store = get_store()
    old_schema = store.get_latest_schema(name)
    
    if not old_schema:
        console.print(f"[bold red]Error:[/bold red] No baseline schema found for '{name}'")
        raise typer.Exit(code=1)

    path = Path(file_path).resolve()
    if not path.exists():
        console.print(f"[bold red]Error:[/bold red] File not found: {path}")
        raise typer.Exit(code=1)

    # Infer new schema
    console.print(f"🔍 Comparing '[bold]{name}[/bold]' against '{path.name}'...")
    inferer = SchemaInferer()
    try:
        new_schema = inferer.infer(str(path), name)
    finally:
        inferer.close()

    # Detect Drift
    detector = DriftDetector()
    diff = detector.detect_drift(old_schema, new_schema)

    if not diff.has_drift:
        console.print(Panel("[bold green]No Drift Detected[/bold green]\nSchemas are identical.", title="Drift Report"))
    else:
        # Build changes summary
        msg = []
        if diff.added_columns:
            msg.append(f"[green]+ Added columns ({len(diff.added_columns)}):[/green]")
            for col in diff.added_columns:
                msg.append(f"  - {col.name} ({col.dtype})")
        
        if diff.removed_columns:
            msg.append(f"[red]- Removed columns ({len(diff.removed_columns)}):[/red]")
            for col in diff.removed_columns:
                msg.append(f"  - {col.name}")
        
        if diff.changed_columns:
            msg.append(f"[yellow]~ Changed columns ({len(diff.changed_columns)}):[/yellow]")
            for change in diff.changed_columns:
                cname = change['column_name']
                details = []
                if 'dtype' in change:
                    details.append(f"Type: {change['dtype']['old']} -> {change['dtype']['new']}")
                if 'nullable' in change:
                    details.append(f"Nullable: {change['nullable']['old']} -> {change['nullable']['new']}")
                msg.append(f"  - {cname}: {', '.join(details)}")

        console.print(Panel("\n".join(msg), title="[bold red]Drift Detected![/bold red]", border_style="red"))
        raise typer.Exit(code=1) # Non-zero exit code for CI/CD pipelines


@app.command()
def validate(
    file_path: str = typer.Argument(..., help="Path to data file"),
    rules: str = typer.Option(..., "--rules", "-r", help="Path to rules YAML"),
):
    """Run validations against a data file."""
    path = Path(file_path).resolve()
    rules_path = Path(rules).resolve()
    
    if not path.exists():
        console.print(f"[bold red]Error:[/bold red] Data file not found: {path}")
        raise typer.Exit(code=1)
        
    if not rules_path.exists():
        console.print(f"[bold red]Error:[/bold red] Rules file not found: {rules_path}")
        raise typer.Exit(code=1)

    # 1. Parse Rules
    console.print(f"📋 Loading rules from {rules_path.name}...")
    try:
        parsed_rules = RuleParser.parse_yaml(str(rules_path))
    except Exception as e:
        console.print(f"[bold red]Error parsing rules:[/bold red] {e}")
        raise typer.Exit(code=1)

    if not parsed_rules:
        console.print("[yellow]No rules found in validation file.[/yellow]")
        return

    # Determine if file_path is an actual path or a dataset name
    path = Path(file_path)
    if path.exists():
        path = path.resolve()
        dataset_name = path.stem
        # Register if new
        store = get_store()
        existing_ds = store.get_dataset(dataset_name)
        if not existing_ds:
            ds = Dataset(name=dataset_name, file_path=str(path), format=path.suffix.lstrip('.'))
            store.register_dataset(ds)
            
    else:
        # Argument is likely a DATASET NAME, not a file path
        dataset_name = file_path
        store = get_store()
        existing_ds = store.get_dataset(dataset_name)
        
        if not existing_ds:
            console.print(f"[bold red]Error:[/bold red] Data file not found: {file_path}")
            console.print(f"Also tried looking up dataset '{dataset_name}' but it was not found in the metadata store.")
            raise typer.Exit(code=1)
            
        # Use stored path
        path = Path(existing_ds.file_path).resolve()
        if not path.exists():
             console.print(f"[bold red]Error:[/bold red] Registered file for dataset '{dataset_name}' does not exist at: {path}")
             raise typer.Exit(code=1)
             
        # console.print(f"Using registered dataset '{dataset_name}' -> {path}")

    # 4. Execute
    console.print(f"🚀 Running {len(parsed_rules)} checks against [cyan]{dataset_name}[/cyan]...")
    executor = ValidationExecutor()
    run = executor.validate(dataset_name, str(path), parsed_rules)
    
    # 5. Save Results
    store.save_validation_run(run)
    
    # 6. Report
    table = Table(title=f"Validation Results: {dataset_name}")
    table.add_column("Column", style="cyan")
    table.add_column("Rule", style="magenta")
    table.add_column("Status", justify="center")
    table.add_column("Failures", justify="right", style="red")
    
    for res in run.results:
        status = "[green]PASS[/green]" if res.passed else "[bold red]FAIL[/bold red]"
        failures = str(res.failure_count) if not res.passed else "-"
        # Format rule type + params
        rule_desc = f"{res.rule.type}"
        if res.rule.params:
            rule_desc += f" {res.rule.params}"
            
        table.add_row(
            res.rule.column,
            rule_desc,
            status,
            failures
        )
        
    console.print(table)
    
    if run.failed_checks > 0:
        console.print(f"\n[bold red]❌ Validation Failed![/bold red] {run.failed_checks} checks failed.")
        raise typer.Exit(code=1)
    else:
        console.print(f"\n[bold green]✅ Validation Passed![/bold green] All {run.total_checks} checks passed.")


# Lineage subcommand group
lineage_app = typer.Typer(help="Lineage operations")
app.add_typer(lineage_app, name="lineage")


@lineage_app.command("show")
def lineage_show(
    name: str = typer.Argument(..., help="Dataset or Process name"),
    format: str = typer.Option("text", "--format", "-f", help="Output format: text, mermaid"),
):
    """Show lineage dependencies for a dataset."""
    store = get_store()
    graph = store.get_lineage_graph()
    
    # Check if node exists in graph (either as source or target)
    # Graph is {source: [targets]}
    all_nodes = set(graph.keys())
    for targets in graph.values():
        all_nodes.update(targets)
        
    if name not in all_nodes:
        console.print(f"[bold red]Node '{name}' not found in lineage graph.[/bold red]")
        return # Don't exit 1, just informational

    if format == "mermaid":
        console.print("graph TD;")
        for src, targets in graph.items():
            for tgt in targets:
                console.print(f"    {src} --> {tgt};")
        return

    # Text format: Simple BFS to show downstream
    console.print(f"🔗 Lineage for [cyan]{name}[/cyan]")
    
    # downstream
    console.print("[bold]Downstream (Impacts):[/bold]")
    queue = [(name, 0)]
    visited = {name}
    
    if name not in graph:
        console.print("  (None)")
    else:
        while queue:
            curr, level = queue.pop(0)
            if level > 0:
                indent = "  " * level
                console.print(f"{indent}↳ {curr}")
            
            if curr in graph:
                for neighbor in graph[curr]:
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append((neighbor, level + 1))

    # Upstream (Sources) - Inefficient but works for small graphs
    # We need to reverse the graph
    rev_graph = {}
    for src, targets in graph.items():
        for tgt in targets:
            if tgt not in rev_graph:
                rev_graph[tgt] = []
            rev_graph[tgt].append(src)
            
    console.print("[bold]Upstream (Sources):[/bold]")
    queue = [(name, 0)]
    visited = {name}
    
    if name not in rev_graph:
        console.print("  (None)")
    else:
        while queue:
            curr, level = queue.pop(0)
            if level > 0:
                indent = "  " * level
                console.print(f"{indent}↳ {curr}")
            
            if curr in rev_graph:
                for neighbor in rev_graph[curr]:
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append((neighbor, level + 1))


# Contract subcommand group
contract_app = typer.Typer(help="Data Contract operations")
app.add_typer(contract_app, name="contract")

@contract_app.command("generate")
def contract_generate(
    dataset: str = typer.Argument(..., help="Dataset name"),
    rules: str = typer.Option(None, "--rules", "-r", help="Path to rules YAML"),
    out: str = typer.Option("contract.json", "--out", "-o", help="Output file path"),
):
    """Generate a Data Contract from schema and rules."""
    from dataguard.core.contracts import ContractManager
    
    manager = ContractManager(get_store())
    
    try:
        console.print(f"📜 Generating contract for [cyan]{dataset}[/cyan]...")
        contract = manager.generate_contract(dataset, rules)
        
        # Save to file
        with open(out, "w") as f:
            f.write(contract.model_dump_json(indent=2, by_alias=True))
            
        console.print(f"[green]✅ Contract saved to:[/green] {out}")
        
    except ValueError as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        raise typer.Exit(code=1)

@contract_app.command("verify")
def contract_verify(
    file_path: str = typer.Argument(..., help="Path to data file to verify"),
    contract_path: str = typer.Option(..., "--contract", "-c", help="Path to contract JSON/YAML"),
):
    """Verify a file against an existing Data Contract."""
    from dataguard.core.contracts import ContractManager
    from dataguard.storage.models import DataContract
    
    # 1. Load Contract
    try:
        with open(contract_path, "r") as f:
            # We assume JSON for now as generated by 'generate', but Pydantic handles JSON pretty well
            contract_data = f.read()
            contract = DataContract.model_validate_json(contract_data)
    except Exception as e:
        console.print(f"[bold red]Error loading contract:[/bold red] {e}")
        raise typer.Exit(code=1)
        
    console.print(f"📜 Verifying [bold]{file_path}[/bold] against contract for [cyan]{contract.dataset_name}[/cyan]...")
    
    manager = ContractManager(get_store())
    
    try:
        # 2. Verify
        run = manager.verify_contract(file_path, contract)
        
        # 3. Report Results
        if run.failed_checks > 0:
            console.print(f"\n[bold red]❌ Contract Violated![/bold red] {run.failed_checks} validation rules failed.")
            raise typer.Exit(code=1)
        else:
            console.print("\n[bold green]✅ Contract Method Verified![/bold green]")
            console.print(f"   - Schema: STRICT MATCH (No drift)")
            console.print(f"   - Rules:  {run.total_checks} checks passed")
            
    except ValueError as e:
        console.print(f"\n[bold red]❌ Schema Contract Violation![/bold red]")
        console.print(str(e))
        raise typer.Exit(code=1)

if __name__ == "__main__":
    app()
