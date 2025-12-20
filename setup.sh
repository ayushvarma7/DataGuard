#!/bin/bash

# DataGuard Project Setup Script
# Run this after cloning the repo to create the folder structure

set -e

echo "🛡️  Setting up DataGuard project structure..."

# Create main package directories
mkdir -p dataguard/core
mkdir -p dataguard/storage
mkdir -p dataguard/engine
mkdir -p dataguard/ui

# Create test directory
mkdir -p tests

# Create examples directory with sample data
mkdir -p examples/sports_tv

# Create docs directory
mkdir -p docs

# Create web demo directory (for Phase 5)
mkdir -p web/src
mkdir -p web/public

# Create __init__.py files
touch dataguard/__init__.py
touch dataguard/core/__init__.py
touch dataguard/storage/__init__.py
touch dataguard/engine/__init__.py
touch dataguard/ui/__init__.py
touch tests/__init__.py

# Create placeholder files
touch dataguard/cli.py
touch dataguard/core/schema.py
touch dataguard/core/validator.py
touch dataguard/core/lineage.py
touch dataguard/core/contracts.py
touch dataguard/storage/metadata.py
touch dataguard/storage/models.py
touch dataguard/engine/duckdb_engine.py
touch dataguard/ui/dashboard.py

# Create test files
touch tests/test_engine.py
touch tests/test_schema.py
touch tests/test_validator.py
touch tests/test_lineage.py
touch tests/test_metadata.py

# Create sample data files
cat > examples/sports_tv/matches.csv << 'EOF'
match_id,home_team,away_team,broadcast_date,viewer_count,league_id
1,Bayern Munich,Dortmund,2024-12-15,2450000,1
2,Leipzig,Frankfurt,2024-12-16,1820000,1
3,Stuttgart,Wolfsburg,2024-12-17,,1
4,Mainz,Freiburg,2024-12-18,-50000,99
5,Union Berlin,Koln,2024-12-19,980000,1
6,Hoffenheim,Augsburg,2024-12-20,720000,1
7,Bremen,Bochum,2024-12-21,890000,1
8,Gladbach,Heidenheim,2024-12-22,650000,1
EOF

cat > examples/sports_tv/leagues.csv << 'EOF'
id,name,country,tier
1,Bundesliga,Germany,1
2,2. Bundesliga,Germany,2
3,DFB Pokal,Germany,1
EOF

cat > examples/sports_tv/broadcasts.csv << 'EOF'
broadcast_id,match_id,channel,start_time,duration_mins,is_live
1,1,Sky Sports,2024-12-15 15:30:00,120,true
2,2,DAZN,2024-12-16 18:00:00,115,true
3,3,Sky Sports,2024-12-17 20:30:00,118,true
4,4,ARD,2024-12-18 15:30:00,125,false
5,5,Sky Sports,2024-12-19 15:30:00,122,true
EOF

# Create sample rules file
cat > examples/sports_tv/rules.yaml << 'EOF'
dataset: matches
description: Validation rules for SportsTV matches data

validations:
  - column: match_id
    rules:
      - type: not_null
      - type: unique

  - column: home_team
    rules:
      - type: not_null

  - column: away_team
    rules:
      - type: not_null

  - column: broadcast_date
    rules:
      - type: not_null

  - column: viewer_count
    rules:
      - type: not_null
      - type: in_range
        min: 0
        max: 100000000

  - column: league_id
    rules:
      - type: not_null
      - type: referential_integrity
        parent_table: leagues
        parent_column: id
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
venv/
.venv/
ENV/

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# Testing
.pytest_cache/
.coverage
htmlcov/
.tox/
.nox/

# Type checking
.mypy_cache/

# DataGuard specific
*.db
.dataguard/

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Environment
.env
.env.local
EOF

# Create basic CLI file with Typer
cat > dataguard/cli.py << 'EOF'
"""DataGuard CLI - Data Quality Framework"""

import typer
from rich.console import Console

app = typer.Typer(
    name="dataguard",
    help="🛡️ DataGuard - Data Quality Framework with Lineage Tracking",
    add_completion=False,
)
console = Console()

# Schema subcommand group
schema_app = typer.Typer(help="Schema operations")
app.add_typer(schema_app, name="schema")


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
    console.print(f"[yellow]TODO:[/yellow] Infer schema from {file_path} as '{name}'")


@schema_app.command("show")
def schema_show(
    name: str = typer.Argument(..., help="Dataset name"),
):
    """Show current schema for a dataset."""
    console.print(f"[yellow]TODO:[/yellow] Show schema for '{name}'")


@schema_app.command("diff")
def schema_diff(
    name: str = typer.Argument(..., help="Dataset name"),
    file_path: str = typer.Option(None, "--file", "-f", help="Compare against file"),
):
    """Check for schema drift."""
    console.print(f"[yellow]TODO:[/yellow] Check drift for '{name}'")


@app.command()
def validate(
    file_path: str = typer.Argument(..., help="Path to data file"),
    rules: str = typer.Option(..., "--rules", "-r", help="Path to rules YAML"),
):
    """Run validations against a data file."""
    console.print(f"[yellow]TODO:[/yellow] Validate {file_path} with rules {rules}")


if __name__ == "__main__":
    app()
EOF

# Create initial version in __init__.py
cat > dataguard/__init__.py << 'EOF'
"""DataGuard - Data Quality Framework with Lineage Tracking"""

__version__ = "0.1.0"
__author__ = "Ayush Varma"
EOF

echo ""
echo "✅ Project structure created!"
echo ""
echo "📁 Directory structure:"
find . -type f -name "*.py" -o -name "*.csv" -o -name "*.yaml" -o -name "*.toml" 2>/dev/null | head -30
echo ""
echo "🚀 Next steps:"
echo "   1. Create virtual environment: python -m venv venv"
echo "   2. Activate it: source venv/bin/activate"
echo "   3. Install package: pip install -e '.[dev]'"
echo "   4. Test CLI: dataguard --help"
echo ""
echo "Happy coding! 🎉"