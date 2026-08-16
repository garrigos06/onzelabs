#!/usr/bin/env python3
"""
EA FC Career Mode SaaS - Backend API Test Suite
Tests full career flow end-to-end
"""
import requests
import json
import time
import sys
from typing import Dict, Any, Optional

# Base URL from environment
BASE_URL = "https://scout-hub-94.preview.emergentagent.com/api"

# Test data
TEST_USER_1 = {
    "email": f"manager_{int(time.time())}@fccareer.com",
    "password": "SecurePass2026!",
    "name": "Test Manager"
}

TEST_USER_2 = {
    "email": f"rival_{int(time.time())}@fccareer.com",
    "password": "SecurePass2026!",
    "name": "Rival Manager"
}

# Global state
state = {
    "user1_token": None,
    "user2_token": None,
    "arsenal_club_id": None,
    "chelsea_club_id": None,
    "career1_id": None,
    "career2_id": None,
    "candidate_player_id": None,
    "squad_player_id": None,
    "bought_player_id": None,
}

def log_test(name: str, status: str, details: str = ""):
    """Log test result"""
    symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"\n{symbol} {name}: {status}")
    if details:
        print(f"   {details}")

def make_request(method: str, endpoint: str, token: Optional[str] = None, 
                 data: Optional[Dict] = None, timeout: int = 60) -> tuple:
    """Make HTTP request and return (success, response_data, status_code)"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method == "GET":
            resp = requests.get(url, headers=headers, timeout=timeout)
        elif method == "POST":
            resp = requests.post(url, headers=headers, json=data, timeout=timeout)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers, timeout=timeout)
        else:
            return False, {"error": f"Unsupported method: {method}"}, 0
        
        try:
            data = resp.json()
        except Exception:
            data = {"raw": resp.text}
        
        return resp.status_code < 400, data, resp.status_code
    except Exception as e:
        return False, {"error": str(e)}, 0

# ============= TEST FUNCTIONS =============

def test_1_auth_register():
    """Test 1: POST /api/auth/register"""
    print("\n" + "="*60)
    print("TEST 1: Auth Registration")
    print("="*60)
    
    success, data, status = make_request("POST", "/auth/register", data=TEST_USER_1)
    
    if not success:
        log_test("Register User 1", "FAIL", f"Status {status}: {data.get('error', data)}")
        return False
    
    if "token" not in data or "user" not in data:
        log_test("Register User 1", "FAIL", f"Missing token or user in response: {data}")
        return False
    
    state["user1_token"] = data["token"]
    log_test("Register User 1", "PASS", f"Token: {data['token'][:20]}..., User: {data['user']['email']}")
    
    # Register second user for isolation testing
    success2, data2, status2 = make_request("POST", "/auth/register", data=TEST_USER_2)
    if success2 and "token" in data2:
        state["user2_token"] = data2["token"]
        log_test("Register User 2", "PASS", f"User: {data2['user']['email']}")
    else:
        log_test("Register User 2", "WARN", "Could not create second user for isolation test")
    
    return True

def test_2_auth_login():
    """Test 2: POST /api/auth/login"""
    print("\n" + "="*60)
    print("TEST 2: Auth Login")
    print("="*60)
    
    success, data, status = make_request("POST", "/auth/login", data={
        "email": TEST_USER_1["email"],
        "password": TEST_USER_1["password"]
    })
    
    if not success:
        log_test("Login", "FAIL", f"Status {status}: {data.get('error', data)}")
        return False
    
    if "token" not in data or "user" not in data:
        log_test("Login", "FAIL", f"Missing token or user: {data}")
        return False
    
    log_test("Login", "PASS", f"Token received, User: {data['user']['email']}")
    return True

def test_3_me_endpoint():
    """Test 3: GET /api/me (with and without auth)"""
    print("\n" + "="*60)
    print("TEST 3: /me Endpoint")
    print("="*60)
    
    # Test without token (should fail with 401)
    success, data, status = make_request("GET", "/me")
    if status == 401:
        log_test("GET /me without token", "PASS", "Correctly returned 401")
    else:
        log_test("GET /me without token", "FAIL", f"Expected 401, got {status}")
        return False
    
    # Test with token (should succeed)
    success, data, status = make_request("GET", "/me", token=state["user1_token"])
    if not success:
        log_test("GET /me with token", "FAIL", f"Status {status}: {data.get('error', data)}")
        return False
    
    if "user" not in data or "careers" not in data:
        log_test("GET /me with token", "FAIL", f"Missing user or careers: {data}")
        return False
    
    if not isinstance(data["careers"], list):
        log_test("GET /me with token", "FAIL", f"careers should be array: {data}")
        return False
    
    log_test("GET /me with token", "PASS", f"User: {data['user']['email']}, Careers: {len(data['careers'])}")
    return True

def test_4_get_clubs():
    """Test 4: GET /api/clubs"""
    print("\n" + "="*60)
    print("TEST 4: Get Clubs")
    print("="*60)
    
    success, data, status = make_request("GET", "/clubs")
    
    if not success:
        log_test("GET /clubs", "FAIL", f"Status {status}: {data.get('error', data)}")
        return False
    
    if not isinstance(data, list):
        log_test("GET /clubs", "FAIL", f"Expected array, got: {type(data)}")
        return False
    
    if len(data) != 24:
        log_test("GET /clubs", "FAIL", f"Expected 24 clubs, got {len(data)}")
        return False
    
    # Find Arsenal and Chelsea
    arsenal = next((c for c in data if "Arsenal" in c.get("name", "")), None)
    chelsea = next((c for c in data if "Chelsea" in c.get("name", "")), None)
    
    if not arsenal:
        log_test("GET /clubs", "FAIL", "Arsenal not found in clubs")
        return False
    
    state["arsenal_club_id"] = arsenal["id"]
    if chelsea:
        state["chelsea_club_id"] = chelsea["id"]
    
    log_test("GET /clubs", "PASS", f"24 clubs found. Arsenal ID: {arsenal['id']}")
    return True

def test_5_create_career():
    """Test 5: POST /api/careers"""
    print("\n" + "="*60)
    print("TEST 5: Create Career")
    print("="*60)
    
    career_data = {
        "clubId": state["arsenal_club_id"],
        "managerName": "Tester",
        "universeMode": "REALISTA",
        "budget": 150,
        "season": "2026/27"
    }
    
    success, data, status = make_request("POST", "/careers", 
                                        token=state["user1_token"], 
                                        data=career_data,
                                        timeout=90)  # AI objectives may take time
    
    if not success:
        log_test("Create Career", "FAIL", f"Status {status}: {data.get('error', data)}")
        return False
    
    # Verify career structure
    required_fields = ["id", "squad", "standings", "nextMatch", "objectives"]
    missing = [f for f in required_fields if f not in data]
    if missing:
        log_test("Create Career", "FAIL", f"Missing fields: {missing}")
        return False
    
    state["career1_id"] = data["id"]
    squad_size = len(data.get("squad", []))
    standings_size = len(data.get("standings", []))
    objectives_count = len(data.get("objectives", []))
    
    # Verify squad size (~24)
    if squad_size < 20 or squad_size > 30:
        log_test("Create Career", "FAIL", f"Squad size {squad_size} not in expected range 20-30")
        return False
    
    # Verify objectives (5-6 AI generated)
    if objectives_count < 4 or objectives_count > 8:
        log_test("Create Career", "WARN", f"Objectives count {objectives_count} not in expected range 5-6")
    
    # Verify standings
    if standings_size < 18:
        log_test("Create Career", "FAIL", f"Standings size {standings_size} too small")
        return False
    
    # Verify nextMatch
    if not data.get("nextMatch") or "opponentName" not in data["nextMatch"]:
        log_test("Create Career", "FAIL", "nextMatch missing or invalid")
        return False
    
    log_test("Create Career", "PASS", 
             f"Career ID: {data['id']}, Squad: {squad_size}, Objectives: {objectives_count}, Standings: {standings_size}")
    return True

def test_6_get_career():
    """Test 6: GET /api/careers/:id"""
    print("\n" + "="*60)
    print("TEST 6: Get Career Details")
    print("="*60)
    
    success, data, status = make_request("GET", f"/careers/{state['career1_id']}", 
                                        token=state["user1_token"])
    
    if not success:
        log_test("GET Career", "FAIL", f"Status {status}: {data.get('error', data)}")
        return False
    
    # Verify all required sections
    required = ["squad", "finances", "standings", "objectives", "news", "events", "transfers"]
    missing = [f for f in required if f not in data]
    if missing:
        log_test("GET Career", "FAIL", f"Missing fields: {missing}")
        return False
    
    # Verify news exists (at least 1 from career creation)
    news_count = len(data.get("news", []))
    if news_count < 1:
        log_test("GET Career", "FAIL", f"Expected at least 1 news item, got {news_count}")
        return False
    
    # Store a squad player ID for later tests
    if data["squad"] and len(data["squad"]) > 0:
        state["squad_player_id"] = data["squad"][0]["id"]
    
    log_test("GET Career", "PASS", 
             f"Squad: {len(data['squad'])}, News: {news_count}, Events: {len(data['events'])}")
    return True

def test_7_ai_scout():
    """Test 7: POST /api/careers/:id/scout"""
    print("\n" + "="*60)
    print("TEST 7: AI Scout")
    print("="*60)
    
    scout_query = {
        "query": "Preciso de um volante jovem ate 50 milhoes"
    }
    
    success, data, status = make_request("POST", f"/careers/{state['career1_id']}/scout",
                                        token=state["user1_token"],
                                        data=scout_query,
                                        timeout=90)  # AI parsing may take time
    
    if not success:
        log_test("AI Scout", "FAIL", f"Status {status}: {data.get('error', data)}")
        return False
    
    if "filters" not in data or "results" not in data:
        log_test("AI Scout", "FAIL", f"Missing filters or results: {data}")
        return False
    
    filters = data["filters"]
    results = data["results"]
    
    # Verify filters parsed correctly
    if filters.get("position") != "CDM":
        log_test("AI Scout", "WARN", f"Expected position CDM, got {filters.get('position')}")
    
    if not isinstance(results, list):
        log_test("AI Scout", "FAIL", f"Results should be array: {type(results)}")
        return False
    
    if len(results) == 0:
        log_test("AI Scout", "FAIL", "No results returned")
        return False
    
    if len(results) > 12:
        log_test("AI Scout", "WARN", f"Expected up to 12 results, got {len(results)}")
    
    # Verify result structure
    first_result = results[0]
    required_fields = ["id", "realismScore", "realismVerdict", "expectedFee", "fromClubName"]
    missing = [f for f in required_fields if f not in first_result]
    if missing:
        log_test("AI Scout", "FAIL", f"Missing fields in result: {missing}")
        return False
    
    # Verify realismScore is 1-99
    if not (1 <= first_result["realismScore"] <= 99):
        log_test("AI Scout", "FAIL", f"realismScore {first_result['realismScore']} not in range 1-99")
        return False
    
    # Store candidate for scout report
    state["candidate_player_id"] = first_result["id"]
    
    log_test("AI Scout", "PASS", 
             f"Filters: position={filters.get('position')}, maxAge={filters.get('maxAge')}, "
             f"maxValue={filters.get('maxValue')}. Results: {len(results)}")
    return True

def test_8_scout_report():
    """Test 8: POST /api/careers/:id/scout-report"""
    print("\n" + "="*60)
    print("TEST 8: Scout Report")
    print("="*60)
    
    report_data = {
        "playerId": state["candidate_player_id"]
    }
    
    success, data, status = make_request("POST", f"/careers/{state['career1_id']}/scout-report",
                                        token=state["user1_token"],
                                        data=report_data,
                                        timeout=90)  # AI report may take time
    
    if not success:
        log_test("Scout Report", "FAIL", f"Status {status}: {data.get('error', data)}")
        return False
    
    required = ["player", "fromClub", "realism", "expectedFee", "expectedWage", "report"]
    missing = [f for f in required if f not in data]
    if missing:
        log_test("Scout Report", "FAIL", f"Missing fields: {missing}")
        return False
    
    # Verify realism structure
    realism = data["realism"]
    if "score" not in realism or "verdict" not in realism or "factors" not in realism:
        log_test("Scout Report", "FAIL", f"Invalid realism structure: {realism}")
        return False
    
    # Verify report structure
    report = data["report"]
    report_fields = ["summary", "pros", "cons", "risks", "role", "confidence"]
    missing_report = [f for f in report_fields if f not in report]
    if missing_report:
        log_test("Scout Report", "FAIL", f"Missing report fields: {missing_report}")
        return False
    
    # Verify arrays
    if not isinstance(report["pros"], list) or not isinstance(report["cons"], list) or not isinstance(report["risks"], list):
        log_test("Scout Report", "FAIL", "pros, cons, risks should be arrays")
        return False
    
    log_test("Scout Report", "PASS", 
             f"Player: {data['player']['name']}, Realism: {realism['score']}/100 ({realism['verdict']}), "
             f"Fee: €{data['expectedFee']}M, Pros: {len(report['pros'])}, Cons: {len(report['cons'])}")
    return True

def test_9_transfer_buy():
    """Test 9: POST /api/careers/:id/transfers (buy)"""
    print("\n" + "="*60)
    print("TEST 9: Transfer BUY")
    print("="*60)
    
    # Get current squad size and budget
    success, career_before, status = make_request("GET", f"/careers/{state['career1_id']}", 
                                                  token=state["user1_token"])
    if not success:
        log_test("Transfer BUY - Get Before", "FAIL", "Could not get career before transfer")
        return False
    
    squad_size_before = len(career_before["squad"])
    budget_before = career_before["finances"]["transferBudget"]
    
    transfer_data = {
        "type": "buy",
        "playerId": state["candidate_player_id"],
        "fee": 40,
        "wage": 80
    }
    
    success, data, status = make_request("POST", f"/careers/{state['career1_id']}/transfers",
                                        token=state["user1_token"],
                                        data=transfer_data)
    
    if not success:
        log_test("Transfer BUY", "FAIL", f"Status {status}: {data.get('error', data)}")
        return False
    
    if "squad" not in data or "finances" not in data:
        log_test("Transfer BUY", "FAIL", f"Missing squad or finances: {data}")
        return False
    
    squad_size_after = len(data["squad"])
    budget_after = data["finances"]["transferBudget"]
    
    # Verify squad increased by 1
    if squad_size_after != squad_size_before + 1:
        log_test("Transfer BUY", "FAIL", 
                f"Squad size should increase by 1: {squad_size_before} -> {squad_size_after}")
        return False
    
    # Verify budget decreased by fee
    expected_budget = budget_before - 40
    if abs(budget_after - expected_budget) > 0.1:
        log_test("Transfer BUY", "FAIL", 
                f"Budget should be {expected_budget}, got {budget_after}")
        return False
    
    # Verify player is in squad
    bought_player = next((p for p in data["squad"] if p["id"] == state["candidate_player_id"]), None)
    if not bought_player:
        log_test("Transfer BUY", "FAIL", "Bought player not found in squad")
        return False
    
    state["bought_player_id"] = state["candidate_player_id"]
    
    # Verify persistence
    success, career_after, status = make_request("GET", f"/careers/{state['career1_id']}", 
                                                 token=state["user1_token"])
    if success:
        persisted_squad_size = len(career_after["squad"])
        persisted_budget = career_after["finances"]["transferBudget"]
        
        if persisted_squad_size != squad_size_after:
            log_test("Transfer BUY - Persistence", "FAIL", 
                    f"Squad size not persisted: {squad_size_after} vs {persisted_squad_size}")
            return False
        
        if abs(persisted_budget - budget_after) > 0.1:
            log_test("Transfer BUY - Persistence", "FAIL", 
                    f"Budget not persisted: {budget_after} vs {persisted_budget}")
            return False
        
        # Verify transfer record exists
        transfers = career_after.get("transfers", [])
        buy_transfer = next((t for t in transfers if t.get("type") == "buy" and t.get("playerId") == state["candidate_player_id"]), None)
        if not buy_transfer:
            log_test("Transfer BUY - Persistence", "FAIL", "Transfer record not found")
            return False
        
        # Verify news exists
        news = career_after.get("news", [])
        if len(news) < 2:  # Should have at least career start + transfer news
            log_test("Transfer BUY - Persistence", "WARN", f"Expected more news items, got {len(news)}")
    
    log_test("Transfer BUY", "PASS", 
             f"Squad: {squad_size_before} -> {squad_size_after}, Budget: €{budget_before}M -> €{budget_after}M")
    return True

def test_10_transfer_sell():
    """Test 10: POST /api/careers/:id/transfers (sell)"""
    print("\n" + "="*60)
    print("TEST 10: Transfer SELL")
    print("="*60)
    
    # Get current squad and budget
    success, career_before, status = make_request("GET", f"/careers/{state['career1_id']}", 
                                                  token=state["user1_token"])
    if not success:
        log_test("Transfer SELL - Get Before", "FAIL", "Could not get career before transfer")
        return False
    
    squad_size_before = len(career_before["squad"])
    budget_before = career_before["finances"]["transferBudget"]
    
    # Find a player to sell (not the just-bought star)
    player_to_sell = None
    for p in career_before["squad"]:
        if p["id"] != state["bought_player_id"]:
            player_to_sell = p
            break
    
    if not player_to_sell:
        log_test("Transfer SELL", "FAIL", "No player found to sell")
        return False
    
    transfer_data = {
        "type": "sell",
        "playerId": player_to_sell["id"],
        "fee": 20,
        "toClub": "Chelsea"
    }
    
    success, data, status = make_request("POST", f"/careers/{state['career1_id']}/transfers",
                                        token=state["user1_token"],
                                        data=transfer_data)
    
    if not success:
        log_test("Transfer SELL", "FAIL", f"Status {status}: {data.get('error', data)}")
        return False
    
    if "squad" not in data or "finances" not in data:
        log_test("Transfer SELL", "FAIL", f"Missing squad or finances: {data}")
        return False
    
    squad_size_after = len(data["squad"])
    budget_after = data["finances"]["transferBudget"]
    
    # Verify squad decreased by 1
    if squad_size_after != squad_size_before - 1:
        log_test("Transfer SELL", "FAIL", 
                f"Squad size should decrease by 1: {squad_size_before} -> {squad_size_after}")
        return False
    
    # Verify budget increased by fee
    expected_budget = budget_before + 20
    if abs(budget_after - expected_budget) > 0.1:
        log_test("Transfer SELL", "FAIL", 
                f"Budget should be {expected_budget}, got {budget_after}")
        return False
    
    # Verify player is NOT in squad
    sold_player = next((p for p in data["squad"] if p["id"] == player_to_sell["id"]), None)
    if sold_player:
        log_test("Transfer SELL", "FAIL", "Sold player still in squad")
        return False
    
    # Verify persistence
    success, career_after, status = make_request("GET", f"/careers/{state['career1_id']}", 
                                                 token=state["user1_token"])
    if success:
        persisted_squad_size = len(career_after["squad"])
        persisted_budget = career_after["finances"]["transferBudget"]
        
        if persisted_squad_size != squad_size_after:
            log_test("Transfer SELL - Persistence", "FAIL", 
                    f"Squad size not persisted: {squad_size_after} vs {persisted_squad_size}")
            return False
        
        if abs(persisted_budget - budget_after) > 0.1:
            log_test("Transfer SELL - Persistence", "FAIL", 
                    f"Budget not persisted: {budget_after} vs {persisted_budget}")
            return False
    
    log_test("Transfer SELL", "PASS", 
             f"Sold {player_to_sell['name']}, Squad: {squad_size_before} -> {squad_size_after}, "
             f"Budget: €{budget_before}M -> €{budget_after}M")
    return True

def test_11_match_center():
    """Test 11: POST /api/careers/:id/matches (2 matches)"""
    print("\n" + "="*60)
    print("TEST 11: Match Center")
    print("="*60)
    
    # Get career before matches
    success, career_before, status = make_request("GET", f"/careers/{state['career1_id']}", 
                                                  token=state["user1_token"])
    if not success:
        log_test("Match Center - Get Before", "FAIL", "Could not get career before matches")
        return False
    
    next_match = career_before.get("nextMatch", {})
    if not next_match or "opponentName" not in next_match:
        log_test("Match Center - Get Before", "FAIL", "No nextMatch found")
        return False
    
    # Get a scorer from squad
    scorer = career_before["squad"][0] if career_before["squad"] else None
    if not scorer:
        log_test("Match Center - Get Before", "FAIL", "No players in squad")
        return False
    
    scorer_goals_before = scorer.get("goals", 0)
    
    # Match 1: WIN (3-1)
    match1_data = {
        "opponentName": next_match["opponentName"],
        "opponentClubId": next_match["opponentClubId"],
        "competition": "Premier League",
        "homeAway": "home",
        "goalsFor": 3,
        "goalsAgainst": 1,
        "scorers": [
            {
                "playerId": scorer["id"],
                "name": scorer["name"],
                "goals": 2,
                "assists": 0
            }
        ]
    }
    
    success, data1, status = make_request("POST", f"/careers/{state['career1_id']}/matches",
                                         token=state["user1_token"],
                                         data=match1_data,
                                         timeout=90)  # AI news may take time
    
    if not success:
        log_test("Match Center - Match 1", "FAIL", f"Status {status}: {data1.get('error', data1)}")
        return False
    
    required = ["standings", "stats", "managerTrust", "fanSentiment", "boardConfidence", "nextMatch"]
    missing = [f for f in required if f not in data1]
    if missing:
        log_test("Match Center - Match 1", "FAIL", f"Missing fields: {missing}")
        return False
    
    # Verify standings updated
    standings = data1["standings"]
    user_row = next((r for r in standings if r.get("isUser")), None)
    opponent_row = next((r for r in standings if r.get("clubId") == next_match["opponentClubId"]), None)
    
    if not user_row:
        log_test("Match Center - Match 1", "FAIL", "User row not found in standings")
        return False
    
    if user_row["P"] != 1 or user_row["W"] != 1 or user_row["Pts"] != 3:
        log_test("Match Center - Match 1", "FAIL", 
                f"User standings incorrect: P={user_row['P']}, W={user_row['W']}, Pts={user_row['Pts']}")
        return False
    
    if opponent_row and (opponent_row["P"] != 1 or opponent_row["L"] != 1):
        log_test("Match Center - Match 1", "WARN", 
                f"Opponent standings: P={opponent_row['P']}, L={opponent_row['L']}")
    
    # Verify stats
    stats = data1["stats"]
    if stats["played"] != 1 or stats["won"] != 1:
        log_test("Match Center - Match 1", "FAIL", 
                f"Stats incorrect: played={stats['played']}, won={stats['won']}")
        return False
    
    # Verify nextMatch changed
    new_next_match = data1["nextMatch"]
    if new_next_match["opponentName"] == next_match["opponentName"]:
        log_test("Match Center - Match 1", "WARN", "nextMatch did not change")
    
    log_test("Match Center - Match 1 (WIN)", "PASS", 
             f"Standings: P={user_row['P']} W={user_row['W']} Pts={user_row['Pts']}, "
             f"Trust: {data1['managerTrust']}, Fans: {data1['fanSentiment']}")
    
    # Verify scorer goals incremented
    success, career_after_m1, status = make_request("GET", f"/careers/{state['career1_id']}", 
                                                    token=state["user1_token"])
    if success:
        scorer_after = next((p for p in career_after_m1["squad"] if p["id"] == scorer["id"]), None)
        if scorer_after:
            scorer_goals_after = scorer_after.get("goals", 0)
            if scorer_goals_after != scorer_goals_before + 2:
                log_test("Match Center - Scorer Stats", "FAIL", 
                        f"Scorer goals should be {scorer_goals_before + 2}, got {scorer_goals_after}")
                return False
            log_test("Match Center - Scorer Stats", "PASS", 
                    f"{scorer['name']} goals: {scorer_goals_before} -> {scorer_goals_after}")
    
    # Match 2: LOSS (1-3)
    time.sleep(1)  # Brief pause between matches
    
    match2_data = {
        "opponentName": new_next_match["opponentName"],
        "opponentClubId": new_next_match["opponentClubId"],
        "competition": "Premier League",
        "homeAway": "away",
        "goalsFor": 1,
        "goalsAgainst": 3,
        "scorers": []
    }
    
    success, data2, status = make_request("POST", f"/careers/{state['career1_id']}/matches",
                                         token=state["user1_token"],
                                         data=match2_data,
                                         timeout=90)
    
    if not success:
        log_test("Match Center - Match 2", "FAIL", f"Status {status}: {data2.get('error', data2)}")
        return False
    
    # Verify standings accumulated
    standings2 = data2["standings"]
    user_row2 = next((r for r in standings2 if r.get("isUser")), None)
    
    if not user_row2:
        log_test("Match Center - Match 2", "FAIL", "User row not found in standings")
        return False
    
    if user_row2["P"] != 2 or user_row2["W"] != 1 or user_row2["L"] != 1:
        log_test("Match Center - Match 2", "FAIL", 
                f"User standings incorrect: P={user_row2['P']}, W={user_row2['W']}, L={user_row2['L']}")
        return False
    
    # Verify trust/sentiment decreased
    if data2["managerTrust"] >= data1["managerTrust"]:
        log_test("Match Center - Match 2", "WARN", 
                f"managerTrust should decrease after loss: {data1['managerTrust']} -> {data2['managerTrust']}")
    
    if data2["fanSentiment"] >= data1["fanSentiment"]:
        log_test("Match Center - Match 2", "WARN", 
                f"fanSentiment should decrease after loss: {data1['fanSentiment']} -> {data2['fanSentiment']}")
    
    log_test("Match Center - Match 2 (LOSS)", "PASS", 
             f"Standings: P={user_row2['P']} W={user_row2['W']} L={user_row2['L']} Pts={user_row2['Pts']}, "
             f"Trust: {data2['managerTrust']}, Fans: {data2['fanSentiment']}")
    
    return True

def test_12_news_generate():
    """Test 12: POST /api/careers/:id/news/generate"""
    print("\n" + "="*60)
    print("TEST 12: News Generation")
    print("="*60)
    
    # Get news count before
    success, career_before, status = make_request("GET", f"/careers/{state['career1_id']}", 
                                                  token=state["user1_token"])
    if not success:
        log_test("News Generate - Get Before", "FAIL", "Could not get career before")
        return False
    
    news_count_before = len(career_before.get("news", []))
    
    success, data, status = make_request("POST", f"/careers/{state['career1_id']}/news/generate",
                                        token=state["user1_token"],
                                        timeout=90)  # AI generation may take time
    
    if not success:
        log_test("News Generate", "FAIL", f"Status {status}: {data.get('error', data)}")
        return False
    
    if "news" not in data:
        log_test("News Generate", "FAIL", f"Missing news in response: {data}")
        return False
    
    news_count_after = len(data["news"])
    
    if news_count_after <= news_count_before:
        log_test("News Generate", "FAIL", 
                f"News count should increase: {news_count_before} -> {news_count_after}")
        return False
    
    # Verify news structure
    latest_news = data["news"][0]
    if "headline" not in latest_news or "body" not in latest_news:
        log_test("News Generate", "FAIL", f"Invalid news structure: {latest_news}")
        return False
    
    log_test("News Generate", "PASS", 
             f"News count: {news_count_before} -> {news_count_after}, "
             f"Latest: {latest_news['headline'][:50]}...")
    return True

def test_13_multi_career_isolation():
    """Test 13: Multi-career + isolation"""
    print("\n" + "="*60)
    print("TEST 13: Multi-Career & Isolation")
    print("="*60)
    
    if not state["user2_token"]:
        log_test("Multi-Career & Isolation", "SKIP", "User 2 not available")
        return True
    
    # Create second career for user 1 (different club)
    if not state["chelsea_club_id"]:
        log_test("Multi-Career & Isolation", "SKIP", "Chelsea club not available")
        return True
    
    career2_data = {
        "clubId": state["chelsea_club_id"],
        "managerName": "Tester 2",
        "universeMode": "REALISTA",
        "budget": 200,
        "season": "2026/27"
    }
    
    success, data, status = make_request("POST", "/careers", 
                                        token=state["user1_token"], 
                                        data=career2_data,
                                        timeout=90)
    
    if not success:
        log_test("Multi-Career - Create 2nd", "FAIL", f"Status {status}: {data.get('error', data)}")
        return False
    
    state["career2_id"] = data["id"]
    log_test("Multi-Career - Create 2nd", "PASS", f"Career 2 ID: {data['id']}")
    
    # Verify GET /api/careers returns 2 careers
    success, careers_list, status = make_request("GET", "/careers", token=state["user1_token"])
    if not success:
        log_test("Multi-Career - List", "FAIL", f"Status {status}: {careers_list.get('error', careers_list)}")
        return False
    
    if not isinstance(careers_list, list) or len(careers_list) != 2:
        log_test("Multi-Career - List", "FAIL", f"Expected 2 careers, got {len(careers_list) if isinstance(careers_list, list) else 'not a list'}")
        return False
    
    log_test("Multi-Career - List", "PASS", f"User 1 has {len(careers_list)} careers")
    
    # Test isolation: User 2 tries to access User 1's career
    success, data, status = make_request("GET", f"/careers/{state['career1_id']}", 
                                        token=state["user2_token"])
    
    if success:
        log_test("Isolation Test", "FAIL", "User 2 should NOT be able to access User 1's career")
        return False
    
    if status not in [401, 404]:
        log_test("Isolation Test", "FAIL", f"Expected 401 or 404, got {status}")
        return False
    
    log_test("Isolation Test", "PASS", f"User 2 correctly denied access (status {status})")
    
    return True

# ============= MAIN TEST RUNNER =============

def run_all_tests():
    """Run all tests in sequence"""
    print("\n" + "="*70)
    print("EA FC CAREER MODE SAAS - BACKEND API TEST SUITE")
    print("="*70)
    print(f"Base URL: {BASE_URL}")
    print(f"Test User 1: {TEST_USER_1['email']}")
    print(f"Test User 2: {TEST_USER_2['email']}")
    print("="*70)
    
    tests = [
        ("Auth Registration", test_1_auth_register),
        ("Auth Login", test_2_auth_login),
        ("/me Endpoint", test_3_me_endpoint),
        ("Get Clubs", test_4_get_clubs),
        ("Create Career", test_5_create_career),
        ("Get Career Details", test_6_get_career),
        ("AI Scout", test_7_ai_scout),
        ("Scout Report", test_8_scout_report),
        ("Transfer BUY", test_9_transfer_buy),
        ("Transfer SELL", test_10_transfer_sell),
        ("Match Center", test_11_match_center),
        ("News Generation", test_12_news_generate),
        ("Multi-Career & Isolation", test_13_multi_career_isolation),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
            if not result:
                print(f"\n⚠️  Test '{test_name}' failed. Continuing with remaining tests...")
        except Exception as e:
            print(f"\n❌ Test '{test_name}' raised exception: {e}")
            import traceback
            traceback.print_exc()
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        symbol = "✅" if result else "❌"
        print(f"{symbol} {test_name}")
    
    print("="*70)
    print(f"TOTAL: {passed}/{total} tests passed ({int(passed/total*100)}%)")
    print("="*70)
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
