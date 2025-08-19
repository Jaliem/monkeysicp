import subprocess
from uagents import Agent, Context, Protocol, Model

# === Configuration ===
AGENTVERSE_API_KEY = "sk_5666831f85d54da1a2922c9b9c53cf2784bc53e6a9fa48f0987ec74efb26737e"
CANISTER_ID = "uxrrr-q7777-77774-qaaaq-cai"  

# === Agent Setup ===
agent = Agent(
    name="doctor_agent",
    seed="doctor_agent_seed",
    port=8000,
    endpoint=["http://127.0.0.1:8000/submit"],
    mailbox=True,
)

# === Message Models ===
class DiseaseQuery(Model):
    disease: str

class DoctorResponse(Model):
    type: str = "DoctorResponse"
    success: bool
    disease: str = ""
    doctors: str = ""
    error: str = ""

# === Motoko Service ===
async def get_doctors_for_disease(disease: str):
    """Call Motoko backend to get doctors for disease"""
    try:
        cmd = f'dfx canister call {CANISTER_ID} getDoctorsByDisease \'("{disease}")\''
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if result.returncode == 0:
            return {"success": True, "doctors": result.stdout.strip()}
        else:
            return {"success": False, "error": result.stderr}
    except Exception as e:
        return {"success": False, "error": str(e)}

# === Protocol ===
doctor_protocol = Protocol("DoctorLookup")

@doctor_protocol.on_message(model=DiseaseQuery, replies=DoctorResponse)
async def handle_disease_query(ctx: Context, sender: str, msg: DiseaseQuery):
    """Handle disease input and return doctor data"""
    
    disease = msg.disease.strip()
    
    if not disease:
        response = DoctorResponse(success=False, error="No disease provided")
    else:
        ctx.logger.info(f"Looking up doctors for disease: {disease}")
        
        # Get doctors from Motoko backend
        result = await get_doctors_for_disease(disease)
        
        if result["success"]:
            response = DoctorResponse(
                success=True,
                disease=disease,
                doctors=result["doctors"]
            )
            ctx.logger.info(f"Found doctors for {disease}")
        else:
            response = DoctorResponse(
                success=False,
                disease=disease,
                error=result["error"]
            )
            ctx.logger.error(f"Error: {result['error']}")
    
    await ctx.send(sender, response)

agent.include(doctor_protocol)

@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"✅ Doctor Agent started")
    ctx.logger.info(f"📋 Agent address: {agent.address}")
    ctx.logger.info(f"🔑 Using API key: {AGENTVERSE_API_KEY[:10]}...")

if __name__ == "__main__":
    agent.run()
