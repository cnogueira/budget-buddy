import sys
from woob.core import Woob

def main():
    woob = Woob()
    print("Woob version:", woob.VERSION)
    
    # Check for bbva module
    repositories = woob.repositories
    # Force update/load of repositories if needed, but usually default is fine.
    
    found = False
    for module_name in repositories.get_all_modules_info().keys():
        if 'bbva' in module_name:
            print(f"Found module: {module_name}")
            found = True
    
    if not found:
        print("BBVA module not found in default repositories.")
    else:
        print("BBVA module is available.")

    # Try to see how we can instantiate a backend
    # We want to use 'bbva' module.
    # backend = woob.load_backend('bbva', 'my_bbva', config={'username': 'foo', 'password': 'bar'})
    # This is a guess on API. verified by some examples online.
    try:
        # verifying import works
        from woob.modules.bbva.module import BbvaModule
        print("Successfully imported BbvaModule directly.")
    except ImportError:
        print("Could not import BbvaModule directly. It might be dynamic.")

if __name__ == "__main__":
    main()
