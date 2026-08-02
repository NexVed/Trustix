import os
import json
import urllib.request
import urllib.error

def load_env_file(filepath=".env"):
    """Parse .env file using pure standard library (no dependencies required)."""
    env_path = os.path.join(os.path.dirname(__file__), filepath)
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if key and not os.getenv(key):
                        os.environ[key] = val

load_env_file()

def test_infura_rpc(url_name, url):
    print(f"\n--- Testing {url_name} ---")
    if not url or "your_infura_api_key_here" in url:
        print(f"❌ {url_name} is not set properly.")
        return False

    payload = json.dumps({
        "jsonrpc": "2.0",
        "method": "eth_blockNumber",
        "params": [],
        "id": 1
    }).encode('utf-8')

    req = urllib.request.Request(
        url,
        data=payload,
        headers={'Content-Type': 'application/json'}
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode('utf-8')
            res_json = json.loads(res_body)
            if "result" in res_json:
                block_num = int(res_json["result"], 16)
                print(f"✅ {url_name} SUCCESS! Current Block Number: {block_num}")
                return True
            elif "error" in res_json:
                print(f"❌ {url_name} FAILED! RPC Error: {res_json['error']}")
                return False
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        print(f"❌ {url_name} HTTP {e.code} Error: {body}")
        return False
    except Exception as e:
        print(f"❌ {url_name} ERROR: {str(e)}")
        return False

def test_supabase():
    print(f"\n--- Testing Supabase Connection ---")
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

    if not url or not key:
        print("❌ Supabase URL or Key is missing in .env")
        return False

    # Test PostgREST table endpoint with auth headers
    req_url = f"{url.rstrip('/')}/rest/v1/users?select=count"
    req = urllib.request.Request(
        req_url,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Range": "0-0"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            print(f"✅ Supabase Connection & API Key SUCCESS! (HTTP Status {response.status})")
            return True
    except urllib.error.HTTPError as e:
        if e.code in [200, 206]:
            print(f"✅ Supabase Connection & API Key SUCCESS! (HTTP Status {e.code})")
            return True
        elif e.code == 401:
            print(f"❌ Supabase API Key Invalid or Rejected (HTTP 401 Unauthorized). Check your SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.")
            return False
        else:
            print(f"⚠️ Supabase Endpoint Reachable (HTTP {e.code}): {e.reason}")
            return True
    except Exception as e:
        print(f"❌ Supabase Connection Error: {str(e)}")
        return False


def test_gcp():
    print(f"\n--- Testing GCP Credentials ---")
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    bucket = os.getenv("GOOGLE_CLOUD_BUCKET")
    print(f"GCP Bucket: {bucket}")
    print(f"GCP Credentials File: {cred_path}")

    if not cred_path:
        print("❌ GOOGLE_APPLICATION_CREDENTIALS not set.")
        return False

    abs_path = os.path.join(os.path.dirname(__file__), cred_path) if not os.path.isabs(cred_path) else cred_path
    if os.path.exists(abs_path):
        try:
            with open(abs_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(f"✅ GCP Credentials File found and valid JSON! Project ID: {data.get('project_id')}, Client Email: {data.get('client_email')}")
                return True
        except Exception as e:
            print(f"❌ GCP Credentials File unparseable: {e}")
            return False
    else:
        print(f"❌ GCP Credentials File does NOT exist at path: {abs_path}")
        return False

if __name__ == "__main__":
    print("==================================================")
    print("        TRUSTIX KEY & CONNECTION TESTER          ")
    print("==================================================")

    test_supabase()
    test_gcp()
    
    polygon_mainnet = os.getenv("POLYGON_RPC_URL")
    test_infura_rpc("Polygon Mainnet (Infura)", polygon_mainnet)

    polygon_amoy = os.getenv("POLYGON_AMOY_RPC_URL")
    test_infura_rpc("Polygon Amoy Testnet (Infura)", polygon_amoy)

    print("\n==================================================")
