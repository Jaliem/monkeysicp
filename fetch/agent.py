import requests
import json
from uagents_core.contrib.protocols.chat import (
    chat_protocol_spec,
    ChatMessage,
    ChatAcknowledgement,
    TextContent,
    StartSessionContent,
)
from uagents import Agent, Context, Protocol
from datetime import datetime, timezone, timedelta
from uuid import uuid4
import time
from typing import Dict, List, Optional

# ASI1 API settings
# Create yours at: https://asi1.ai/dashboard/api-keys
ASI1_API_KEY = "sk_788c2c48752141db894240a3286b8e343adea7f5b8204f15902dd9f5fd1c0c75" # your_asi1_api_key" # Replace with your ASI1 key
ASI1_BASE_URL = "https://api.asi1.ai/v1"
ASI1_HEADERS = {
    "Authorization": f"Bearer {ASI1_API_KEY}",
    "Content-Type": "application/json"
}

CANISTER_ID = "bkyz2-fmaaa-aaaaa-qaaaq-cai"
BASE_URL = "http://127.0.0.1:4943"

HEADERS = {
    "Host": f"{CANISTER_ID}.localhost",
    "Content-Type": "application/json"
}

# Portfolio storage (in production, use a database)
user_portfolio = {}
watchlist = set()
price_alerts = []

# Function definitions for ASI1 function calling
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_fee_percentiles",
            "description": "Gets the 100 fee percentiles measured in millisatoshi/byte.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_balance",
            "description": "Returns the balance of a given Bitcoin address.",
            "parameters": {
                "type": "object",
                "properties": {
                    "address": {
                        "type": "string",
                        "description": "The Bitcoin address to check."
                    }
                },
                "required": ["address"],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_utxos",
            "description": "Returns the UTXOs of a given Bitcoin address.",
            "parameters": {
                "type": "object",
                "properties": {
                    "address": {
                        "type": "string",
                        "description": "The Bitcoin address to fetch UTXOs for."
                    }
                },
                "required": ["address"],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_crypto_price",
            "description": "Gets the current price of a cryptocurrency.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "The cryptocurrency symbol (e.g., BTC, ETH, ADA)"
                    }
                },
                "required": ["symbol"],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_market_data",
            "description": "Gets market data for top cryptocurrencies including prices, market cap, and 24h changes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Number of cryptocurrencies to return (default: 10)"
                    }
                },
                "required": [],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_to_portfolio",
            "description": "Adds a cryptocurrency holding to the user's portfolio.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "The cryptocurrency symbol"
                    },
                    "amount": {
                        "type": "number",
                        "description": "The amount held"
                    },
                    "purchase_price": {
                        "type": "number",
                        "description": "The price when purchased (optional)"
                    }
                },
                "required": ["symbol", "amount"],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_portfolio_value",
            "description": "Gets the current total value of the user's portfolio.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add_to_watchlist",
            "description": "Adds a cryptocurrency to the user's watchlist.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "The cryptocurrency symbol to watch"
                    }
                },
                "required": ["symbol"],
                "additionalProperties": False
            },
            "strict": True
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_fear_greed_index",
            "description": "Gets the current Fear & Greed Index for crypto market sentiment.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
                "additionalProperties": False
            },
            "strict": True
        }
    }
]

async def get_crypto_price_from_api(symbol: str) -> dict:
    """Get cryptocurrency price from CoinGecko API"""
    try:
        url = f"https://api.coingecko.com/api/v3/simple/price?ids={symbol.lower()}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if symbol.lower() in data:
            return {
                "symbol": symbol.upper(),
                "price": data[symbol.lower()]["usd"],
                "change_24h": data[symbol.lower()].get("usd_24h_change", 0),
                "market_cap": data[symbol.lower()].get("usd_market_cap", 0)
            }
        else:
            # Try alternative API or symbol mapping
            symbol_map = {"BTC": "bitcoin", "ETH": "ethereum", "ADA": "cardano", "SOL": "solana"}
            if symbol.upper() in symbol_map:
                mapped_symbol = symbol_map[symbol.upper()]
                url = f"https://api.coingecko.com/api/v3/simple/price?ids={mapped_symbol}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true"
                response = requests.get(url, timeout=10)
                response.raise_for_status()
                data = response.json()
                return {
                    "symbol": symbol.upper(),
                    "price": data[mapped_symbol]["usd"],
                    "change_24h": data[mapped_symbol].get("usd_24h_change", 0),
                    "market_cap": data[mapped_symbol].get("usd_market_cap", 0)
                }
    except Exception as e:
        raise ValueError(f"Could not fetch price for {symbol}: {str(e)}")

async def get_market_data_from_api(limit: int = 10) -> list:
    """Get top cryptocurrency market data"""
    try:
        url = f"https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page={limit}&page=1"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        market_data = []
        for coin in data:
            market_data.append({
                "name": coin["name"],
                "symbol": coin["symbol"].upper(),
                "price": coin["current_price"],
                "market_cap": coin["market_cap"],
                "change_24h": coin["price_change_percentage_24h"],
                "volume_24h": coin["total_volume"]
            })
        return market_data
    except Exception as e:
        raise ValueError(f"Could not fetch market data: {str(e)}")

async def get_fear_greed_from_api() -> dict:
    """Get Fear & Greed Index"""
    try:
        url = "https://api.alternative.me/fng/"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        return {
            "value": int(data["data"][0]["value"]),
            "classification": data["data"][0]["value_classification"],
            "timestamp": data["data"][0]["timestamp"]
        }
    except Exception as e:
        raise ValueError(f"Could not fetch Fear & Greed Index: {str(e)}")

async def call_icp_endpoint(func_name: str, args: dict):
    if func_name == "get_current_fee_percentiles":
        url = f"{BASE_URL}/get-current-fee-percentiles"
        response = requests.post(url, headers=HEADERS, json={})
    elif func_name == "get_balance":
        url = f"{BASE_URL}/get-balance"
        response = requests.post(url, headers=HEADERS, json={"address": args["address"]})
    elif func_name == "get_utxos":
        url = f"{BASE_URL}/get-utxos"
        response = requests.post(url, headers=HEADERS, json={"address": args["address"]})    
    elif func_name == "get_crypto_price":
        return await get_crypto_price_from_api(args["symbol"])
    elif func_name == "get_market_data":
        limit = args.get("limit", 10)
        return await get_market_data_from_api(limit)
    elif func_name == "add_to_portfolio":
        symbol = args["symbol"].upper()
        amount = args["amount"]
        purchase_price = args.get("purchase_price")
        user_portfolio[symbol] = {
            "amount": amount,
            "purchase_price": purchase_price
        }
        return {"message": f"Added {amount} {symbol} to portfolio", "portfolio": user_portfolio}
    elif func_name == "get_portfolio_value":
        total_value = 0
        portfolio_details = []
        for symbol, holding in user_portfolio.items():
            try:
                price_data = await get_crypto_price_from_api(symbol)
                current_price = price_data["price"]
                value = holding["amount"] * current_price
                total_value += value
                
                profit_loss = 0
                if holding.get("purchase_price"):
                    profit_loss = (current_price - holding["purchase_price"]) * holding["amount"]
                
                portfolio_details.append({
                    "symbol": symbol,
                    "amount": holding["amount"],
                    "current_price": current_price,
                    "value": value,
                    "profit_loss": profit_loss
                })
            except:
                portfolio_details.append({
                    "symbol": symbol,
                    "amount": holding["amount"],
                    "error": "Could not fetch current price"
                })
        
        return {
            "total_value": total_value,
            "holdings": portfolio_details
        }
    elif func_name == "add_to_watchlist":
        symbol = args["symbol"].upper()
        watchlist.add(symbol)
        return {"message": f"Added {symbol} to watchlist", "watchlist": list(watchlist)}
    elif func_name == "get_fear_greed_index":
        return await get_fear_greed_from_api()
    else:
        raise ValueError(f"Unsupported function call: {func_name}")
    
    response.raise_for_status()
    return response.json()

async def process_query(query: str, ctx: Context) -> str:
    try:
        # Step 1: Initial call to ASI1 with user query and tools
        initial_message = {
            "role": "user",
            "content": query
        }
        payload = {
            "model": "asi1-mini",
            "messages": [initial_message],
            "tools": tools,
            "temperature": 0.7,
            "max_tokens": 1024
        }
        response = requests.post(
            f"{ASI1_BASE_URL}/chat/completions",
            headers=ASI1_HEADERS,
            json=payload
        )
        response.raise_for_status()
        response_json = response.json()

        # Step 2: Parse tool calls from response
        tool_calls = response_json["choices"][0]["message"].get("tool_calls", [])
        messages_history = [initial_message, response_json["choices"][0]["message"]]

        if not tool_calls:
            return "I couldn't determine what Bitcoin information you're looking for. Please try rephrasing your question."

        # Step 3: Execute tools and format results
        for tool_call in tool_calls:
            func_name = tool_call["function"]["name"]
            arguments = json.loads(tool_call["function"]["arguments"])
            tool_call_id = tool_call["id"]

            ctx.logger.info(f"Executing {func_name} with arguments: {arguments}")

            try:
                result = await call_icp_endpoint(func_name, arguments)
                content_to_send = json.dumps(result)
            except Exception as e:
                error_content = {
                    "error": f"Tool execution failed: {str(e)}",
                    "status": "failed"
                }
                content_to_send = json.dumps(error_content)

            tool_result_message = {
                "role": "tool",
                "tool_call_id": tool_call_id,
                "content": content_to_send
            }
            messages_history.append(tool_result_message)

        # Step 4: Send results back to ASI1 for final answer
        final_payload = {
            "model": "asi1-mini",
            "messages": messages_history,
            "temperature": 0.7,
            "max_tokens": 1024
        }
        final_response = requests.post(
            f"{ASI1_BASE_URL}/chat/completions",
            headers=ASI1_HEADERS,
            json=final_payload
        )
        final_response.raise_for_status()
        final_response_json = final_response.json()

        # Step 5: Return the model's final answer
        return final_response_json["choices"][0]["message"]["content"]

    except Exception as e:
        ctx.logger.error(f"Error processing query: {str(e)}")
        return f"An error occurred while processing your request: {str(e)}"

agent = Agent(
    name='crypto-assistant',
    port=8001,
    mailbox=True,
)
chat_proto = Protocol(spec=chat_protocol_spec)

@chat_proto.on_message(model=ChatMessage)
async def handle_chat_message(ctx: Context, sender: str, msg: ChatMessage):
    try:
        ack = ChatAcknowledgement(
            timestamp=datetime.now(timezone.utc),
            acknowledged_msg_id=msg.msg_id
        )
        await ctx.send(sender, ack)

        for item in msg.content:
            if isinstance(item, StartSessionContent):
                ctx.logger.info(f"Got a start session message from {sender}")
                continue
            elif isinstance(item, TextContent):
                ctx.logger.info(f"Got a message from {sender}: {item.text}")
                response_text = await process_query(item.text, ctx)
                ctx.logger.info(f"Response text: {response_text}")
                response = ChatMessage(
                    timestamp=datetime.now(timezone.utc),
                    msg_id=uuid4(),
                    content=[TextContent(type="text", text=response_text)]
                )
                await ctx.send(sender, response)
            else:
                ctx.logger.info(f"Got unexpected content from {sender}")
    except Exception as e:
        ctx.logger.error(f"Error handling chat message: {str(e)}")
        error_response = ChatMessage(
            timestamp=datetime.now(timezone.utc),
            msg_id=uuid4(),
            content=[TextContent(type="text", text=f"An error occurred: {str(e)}")]
        )
        await ctx.send(sender, error_response)

@chat_proto.on_message(model=ChatAcknowledgement)
async def handle_chat_acknowledgement(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"Received acknowledgement from {sender} for message {msg.acknowledged_msg_id}")
    if msg.metadata:
        ctx.logger.info(f"Metadata: {msg.metadata}")

agent.include(chat_proto)

if __name__ == "__main__":
    agent.run()


"""
CRYPTO ASSISTANT - SAMPLE QUERIES

💰 Portfolio Management:
- Add 2.5 BTC to my portfolio at $45000
- What's my portfolio value?
- Add 10 ETH to my portfolio
- Show me my holdings

📈 Price & Market Data:
- What's the current price of Bitcoin?
- Show me the top 5 cryptocurrencies
- Get market data for the top 10 coins
- What's ETH trading at?

📊 Market Sentiment:
- What's the current Fear & Greed Index?
- Show me market sentiment

👀 Watchlist:
- Add SOL to my watchlist
- Add MATIC to watchlist

₿ Bitcoin Operations:
- What's the balance of address bc1q8sxznvhualuyyes0ded7kgt33876phpjhp29rs?
- What are the current Bitcoin fee percentiles?
- Show me UTXOs for bc1q8sxznvhualuyyes0ded7kgt33876phpjhp29rs

🔥 Example Conversations:
- "I want to track my crypto portfolio"
- "What's happening in the crypto market today?"
- "Add 1.5 BTC to my portfolio bought at $42000"
- "Show me the top cryptocurrencies and their performance"
"""