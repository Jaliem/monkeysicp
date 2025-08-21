
import subprocess
import sys
import os
import time
from typing import List

def run_command(cmd: List[str], cwd: str = None) -> subprocess.Popen:
    """Run a command in a subprocess"""
    try:
        process = subprocess.Popen(
            cmd,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        return process
    except Exception as e:
        print(f"Failed to start command {' '.join(cmd)}: {e}")
        return None

def main():
    """Main startup function"""
    print("🏥 Starting HealthAgent Chat Application...")
    print("=" * 50)
    
    processes = []
    
    try:
        # Start the API server
        print("🚀 Starting API server on port 8080...")
        api_process = run_command([sys.executable, "api_server.py"])
        if api_process:
            processes.append(("API Server", api_process))
            print("✅ API server started")
        else:
            print("❌ Failed to start API server")
            return 1
        
        # Wait a moment for the API server to start
        time.sleep(2)
        
        # Check if frontend directory exists
        frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
        if os.path.exists(frontend_dir):
            print("🎨 Starting frontend development server...")
            frontend_process = run_command(["npm", "run", "dev"], cwd=frontend_dir)
            if frontend_process:
                processes.append(("Frontend Server", frontend_process))
                print("✅ Frontend server started")
                print("\n🌐 Application URLs:")
                print("   Frontend: http://localhost:5173")
                print("   API:      http://localhost:8080")
                print("   API Docs: http://localhost:8080/docs")
            else:
                print("⚠️  Failed to start frontend server (you can start it manually with 'npm run dev')")
        else:
            print("⚠️  Frontend directory not found. API server is running on http://localhost:8080")
        
        print("\n" + "=" * 50)
        print("🏥 HealthAgent Chat is running!")
        print("Press Ctrl+C to stop all services")
        print("=" * 50)
        
        # Wait for all processes to complete or be interrupted
        try:
            while True:
                # Check if any process has died
                for name, process in processes:
                    if process.poll() is not None:
                        print(f"⚠️  {name} has stopped unexpectedly")
                        return 1
                time.sleep(1)
                
        except KeyboardInterrupt:
            print("\n🛑 Shutting down services...")
            
    finally:
        # Clean up all processes
        for name, process in processes:
            try:
                print(f"🔄 Stopping {name}...")
                process.terminate()
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                print(f"⚠️  Force killing {name}...")
                process.kill()
            except Exception as e:
                print(f"⚠️  Error stopping {name}: {e}")
        
        print("✅ All services stopped")
        return 0

if __name__ == "__main__":
    sys.exit(main())