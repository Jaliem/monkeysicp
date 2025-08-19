from uagents import Agent, Context

# Test client to send disease queries
client = Agent(
    name="test_client",
    seed="test_client_seed",
    port=8001,
    endpoint=["http://127.0.0.1:8001/submit"]
)

# Replace with your doctor agent's address
DOCTOR_AGENT_ADDRESS = "agent1q2y97nzkde4pw0u4v4awmkqfcnahjynk7lm9pfkz6jdzsmeh7cx0sgj5g8x"

@client.on_event("startup")
async def test_diseases(ctx: Context):
    """Test different diseases"""
    
    diseases = ["heart disease", "skin problem", "headache", "unknown disease"]
    
    for disease in diseases:
        ctx.logger.info(f"Testing disease: {disease}")
        
        message = {
            "disease": disease
        }
        
        await ctx.send(DOCTOR_AGENT_ADDRESS, message)

@client.on_message(model=dict)
async def handle_response(ctx: Context, sender: str, msg: dict):
    """Handle responses from doctor agent"""
    
    if msg.get("success"):
        ctx.logger.info(f"✅ Found doctors for {msg.get('disease')}: {msg.get('doctors')}")
    else:
        ctx.logger.error(f"❌ Error for {msg.get('disease')}: {msg.get('error')}")

if __name__ == "__main__":
    client.run()