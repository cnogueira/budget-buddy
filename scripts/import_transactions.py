import sys
import json
import argparse
import datetime
from decimal import Decimal

# Helper to serialize date/decimal
def json_serial(obj):
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Type {type(obj)} not serializable")

def mock_fetch(username, password):
    # Return some fake transactions for testing UI
    return [
        {
            "date": datetime.date.today().isoformat(),
            "amount": -45.50,
            "label": "MOCK GROCERY STORE",
            "category": "Food"
        },
        {
            "date": datetime.date.today().isoformat(),
            "amount": -12.00,
            "label": "MOCK NETFLIX",
            "category": "Entertainment"
        },
        {
            "date": (datetime.date.today() - datetime.timedelta(days=1)).isoformat(),
            "amount": 1500.00,
            "label": "MOCK SALARY",
            "category": "Income"
        }
    ]

def woob_fetch(bank_module, username, password):
    try:
        from woob.core import Woob
        from woob.capabilities.bank import CapBank
    except ImportError:
        raise ImportError("woob not installed or not found in python path")

    w = Woob()
    
    # Attempt to load the module. 
    # Since we don't have a config file, we try to create a backend dynamically.
    # This is non-standard for CLI woob but common for library usage.
    
    # We need to find the module logic.
    # Woob repositories might need update?
    # w.repositories.update_repositories() 
    
    # Install module if missing?
    # if not w.repositories.get_module_info(bank_module):
    #    w.repositories.install(bank_module)

    # Dynamically build backend
    # Note: The parameters 'username' and 'password' key names depend on the module!
    # Most use 'login'/'username' and 'password'.
    # We will assume 'login' and 'password' for generic bank, but 'bbva' might differ.
    # For now, we try to map common keys.
    
    config = {
        'login': username,
        'username': username,
        'password': password
    }
    
    # We effectively create a backend named 'temp_backend' using 'bank_module'
    try:
        backend = w.build_backend(bank_module, 'temp_backend', config)
    except Exception as e:
        # Retry with minimal config if strict keys failed (some modules complain about extra keys)
        # But build_backend usually filters? No.
        # We need to know specific config keys for the module.
        # For this generic script, we pass what we have.
        raise Exception(f"Failed to build backend '{bank_module}': {str(e)}")

    if not backend:
         raise Exception(f"Could not create backend for {bank_module}")

    transactions = []
    
    try:
        # Force iter_accounts to establish session
        for account in backend.iter_accounts():
            # For each account, fetch history
            if backend.has_capability(CapBank):
                 for tr in backend.iter_history(account):
                     transactions.append({
                         "date": tr.date,
                         "amount": tr.amount,
                         "label": tr.label,
                         "raw_label": tr.raw,
                         "category": tr.category,
                         "id": tr.id
                     })
    except Exception as e:
         raise Exception(f"Error fetching data: {str(e)}")
         
    return transactions

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('bank', help='Bank module name (e.g. bbva)')
    args = parser.parse_args()

    # Read credentials from stdin
    try:
        input_data = sys.stdin.read()
        if not input_data:
             # Just exit if no input, or print error
             print(json.dumps({"error": "No input provided"}), file=sys.stdout)
             sys.exit(1)
        creds = json.loads(input_data)
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON input: {str(e)}"}), file=sys.stdout)
        sys.exit(1)

    if args.bank == 'mock':
        data = mock_fetch(creds.get('username'), creds.get('password'))
        # Dump to stdout
        print(json.dumps(data, default=json_serial))
        sys.exit(0)

    # Real implementation attempt
    try:
        data = woob_fetch(args.bank, creds.get('username'), creds.get('password'))
        print(json.dumps(data, default=json_serial))
    except Exception as e:
        # Return error as JSON so server action can parse it
        print(json.dumps({"error": str(e)}), file=sys.stdout)
        # We exit 0 so Node can read the JSON. If we exit 1, Node exec might throw.
        # But usually we want to distinguish. safely:
        sys.exit(0) 

if __name__ == '__main__':
    main()
