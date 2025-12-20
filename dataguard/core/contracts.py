from typing import List, Dict, Any, Optional
from dataguard.storage.metadata import MetadataStore
from dataguard.storage.models import DataContract, ValidationRule, TableSchema
from dataguard.core.validator import RuleParser

class ContractManager:
    """Manages creation and verification of Data Contracts."""
    
    def __init__(self, store: Optional[MetadataStore] = None):
        self.store = store or MetadataStore()
        
    def generate_contract(self, dataset_name: str, rules_path: Optional[str] = None, slo: Dict[str, Any] = None) -> DataContract:
        """
        Generate a Data Contract for a given dataset.
        
        Args:
            dataset_name: Name of the dataset to target.
            rules_path: Path to rules.yaml file (optional).
            slo: Dictionary of SLOs (optional).
            
        Returns:
            DataContract object.
        """
        # 1. Fetch Schema
        schema = self.store.get_latest_schema(dataset_name)
        if not schema:
            raise ValueError(f"No schema found for dataset '{dataset_name}'. Please infer schema first.")
            
        # 2. Fetch Rules
        rules = []
        if rules_path:
            rules = RuleParser.parse_yaml(rules_path)
            
        # 3. Assemble
        contract = DataContract(
            dataset_name=dataset_name,
            schema=schema,
            rules=rules,
            slo=slo or {}
        )
        
        return contract

    def verify_contract(self, file_path: str, contract: DataContract) -> Any:
        """
        Verify a data file against a Data Contract.
        
        Args:
            file_path: Path to the data file.
            contract: The DataContract object to verify against.
            
        Returns:
            ValidationRun object containing results.
            
        Raises:
            ValueError: If schema drift is detected (Strict Schema Check).
        """
        from dataguard.core.schema import SchemaInferer
        from dataguard.core.drift import DriftDetector
        from dataguard.core.validator import ValidationExecutor
        
        # 1. Strict Schema Check
        # We infer the schema of the FILE and compare it to the CONTRACT schema.
        inferer = SchemaInferer()
        file_schema = inferer.infer(file_path, "contract_check")
        
        detector = DriftDetector()
        diff = detector.detect_drift(contract.schema_snap, file_schema)
        
        if diff.has_drift:
            # For contracts, any drift is a violation
            raise ValueError(f"Contract Schema Violation:\nAdded: {diff.added_columns}\nRemoved: {diff.removed_columns}\nChanged: {diff.changed_columns}")
            
        # 2. Rule Validation
        # If schema matches, we run the rules defined in the contract
        executor = ValidationExecutor()
        
        # We reuse the existing validate method
        run = executor.validate(contract.dataset_name, file_path, contract.rules)
        return run


