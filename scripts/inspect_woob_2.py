import sys
from woob.core import Woob

def main():
    woob = Woob()
    print("Woob version:", woob.VERSION)
    
    # Check for fakebank module
    # Force update/load of repositories if needed, but usually default is fine.
    
    found_fake = False
    query = 'bbva'
    
    print("Listing all modules...")
    repo = woob.repositories
    for module_name in repo.get_all_modules_info().keys():
        if module_name == 'fakebank':
            found_fake = True
            print("Found module: fakebank")
        if query in module_name:
             print(f"Found matching module: {module_name}")

    if not found_fake:
        print("fakebank module not found.")
    
    # Try to install fakebank if possible?
    # woob.repositories.install('fakebank') 
    
if __name__ == "__main__":
    main()
