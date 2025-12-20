# DataGuard 🛡️

> Data Quality Framework with Schema Drift Detection, Validation Engine & Lineage Tracking

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![DuckDB](https://img.shields.io/badge/DuckDB-Latest-yellow.svg)](https://duckdb.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

DataGuard is a lightweight, open-source data quality framework that helps data engineers catch schema changes, validate data quality, and track column-level lineage—all without expensive enterprise tools.

**🌐 [Try the Live Demo](https://yourusername.github.io/dataguard)** — Runs entirely in your browser, no server required.

---

## ✨ Features

- **Schema Inference & Drift Detection** — Automatically detect when your data structure changes
- **Validation Rules Engine** — Define rules in YAML, get actionable failure reports
- **Lineage Tracking** — Track column-level data flow from source to output
- **Data Contracts** — Auto-generate contracts for cross-team agreements
- **Zero Cost** — DuckDB + SQLite, no cloud dependencies
- **Privacy First** — Browser demo processes files locally via WebAssembly

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DataGuard                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   SOURCES    │    │  PROCESSING  │    │   OUTPUTS    │       │
│  │  CSV/Parquet │───▶│  DuckDB      │───▶│  Reports     │       │
│  │  Databases   │    │  Engine      │    │  Alerts      │       │
│  │  Excel       │    │              │    │  Contracts   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│          │                  │                   │                │
│          ▼                  ▼                   ▼                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              METADATA STORE (SQLite)                     │    │
│  │  • Schema snapshots    • Validation history              │    │
│  │  • Lineage graph       • Data contracts                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dataguard.git
cd dataguard

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e .
```

### Basic Usage

```bash
# Infer schema from a file
dataguard schema infer ./data/matches.csv --name matches

# Check for schema drift
dataguard schema diff matches

# Run validations
dataguard validate matches --rules ./rules/matches.yaml

# View lineage
dataguard lineage show revenue_report --format mermaid

# Generate data contract
dataguard contract generate matches

# Launch dashboard
dataguard ui
```

---

## 📁 Project Structure

```
dataguard/
├── dataguard/
│   ├── __init__.py
│   ├── cli.py                 # Typer CLI application
│   ├── core/
│   │   ├── __init__.py
│   │   ├── schema.py          # Schema inference & drift detection
│   │   ├── validator.py       # Validation rules engine
│   │   ├── lineage.py         # Lineage tracking & DAG
│   │   └── contracts.py       # Data contract generation
│   ├── storage/
│   │   ├── __init__.py
│   │   ├── metadata.py        # SQLite operations
│   │   └── models.py          # Pydantic data models
│   ├── engine/
│   │   ├── __init__.py
│   │   └── duckdb_engine.py   # DuckDB query execution
│   └── ui/
│       ├── __init__.py
│       └── dashboard.py       # Streamlit dashboard
├── web/                       # Browser demo (React + DuckDB-WASM)
│   ├── src/
│   ├── public/
│   └── package.json
├── tests/
│   ├── test_schema.py
│   ├── test_validator.py
│   └── test_lineage.py
├── examples/
│   ├── sports_tv/             # Sample SportsTV Germany dataset
│   │   ├── matches.csv
│   │   ├── leagues.csv
│   │   └── rules.yaml
│   └── ecommerce/             # Additional example
├── docs/
│   ├── getting-started.md
│   ├── validation-rules.md
│   └── lineage-tracking.md
├── pyproject.toml
├── README.md
└── LICENSE
```

---

## 🛠️ Tech Stack

| Component | Technology | Why |
|-----------|------------|-----|
| Query Engine | DuckDB | Fast, in-process, handles CSV/Parquet natively |
| Metadata Store | SQLite | Simple, file-based, zero configuration |
| CLI Framework | Typer | Modern CLI with auto-generated help |
| Data Models | Pydantic | Validation & serialization |
| Dashboard | Streamlit | Rapid UI development |
| Web Demo | React + DuckDB-WASM | Browser-based, no server needed |
| Config Format | YAML | Human-readable rule definitions |
| Visualization | Mermaid | Lineage diagrams |

---

## 📋 Development Roadmap

### Phase 1: Schema Inference & Drift Detection ✅
- [x] Project setup & dependencies
- [x] DuckDB engine wrapper
- [x] Schema inference from CSV/Parquet
- [x] SQLite metadata store
- [x] Schema snapshot storage
- [x] Drift detection algorithm
- [x] CLI commands: `schema infer`, `schema diff`
- [x] Unit tests

### Phase 2: Validation Rules Engine ✅
- [x] YAML rule parser
- [x] Validation rule types (not_null, unique, range, etc.)
- [x] SQL query generator for each rule type
- [x] Validation executor
- [x] Report generator (JSON, terminal table)
- [x] CLI command: `validate`
- [x] Unit tests

### Phase 3: Lineage Tracking ✅
- [x] Lineage data model (DAG)
- [x] Decorator-based lineage capture (`@track_lineage`)
- [x] Lineage storage in SQLite
- [x] Mermaid diagram generator (CLI & Dashboard)
- [x] CLI commands: `lineage show`
- [x] Unit tests

### Phase 4: Data Contracts & Polish ✅
- [x] Contract schema definition (`DataContract`)
- [x] Auto-generate contracts from schema + rules (`contract generate`)
- [x] Contract verification (`contract verify`)
- [x] Streamlit dashboard (Schema, Drift, Lineage)
- [x] Documentation Polish

### Phase 5: Browser Demo 📅
- [ ] React app setup
- [ ] DuckDB-WASM integration
- [ ] File upload & parsing
- [ ] Schema inference in browser
- [ ] Validation in browser
- [ ] Deploy to GitHub Pages

---

## 📖 Documentation

### Validation Rule Types

```yaml
# rules/matches.yaml
dataset: matches
validations:
  - column: match_id
    rules:
      - type: not_null
      - type: unique

  - column: viewer_count
    rules:
      - type: not_null
      - type: in_range
        min: 0
        max: 100000000

  - column: broadcast_date
    rules:
      - type: not_null
      - type: freshness
        max_age_hours: 48

  - column: league_id
    rules:
      - type: referential_integrity
        parent_table: leagues
        parent_column: id
```

### Available Rule Types

| Rule | Description | Parameters |
|------|-------------|------------|
| `not_null` | Column has no null values | — |
| `unique` | All values are unique | — |
| `in_range` | Numeric values within bounds | `min`, `max` |
| `in_set` | Values from allowed list | `values: [a, b, c]` |
| `regex_match` | String matches pattern | `pattern` |
| `freshness` | Data not older than threshold | `max_age_hours` |
| `referential_integrity` | FK exists in parent | `parent_table`, `parent_column` |
| `row_count` | Table has expected rows | `min`, `max` |

---

## 🧪 Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=dataguard

# Run specific test file
pytest tests/test_schema.py -v
```

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [DuckDB](https://duckdb.org/) — The amazing in-process SQL engine
- [Great Expectations](https://greatexpectations.io/) — Inspiration for validation patterns
- [dbt](https://www.getdbt.com/) — Inspiration for lineage concepts

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/yourusername">Ayush Varma</a>
</p>