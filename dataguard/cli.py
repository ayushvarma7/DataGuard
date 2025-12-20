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
    console.print(f"[yellow]TODO:[/yellow] Validate {file_path} with rules {rules}")


if __name__ == "__main__":
    app()
