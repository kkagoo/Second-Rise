#!/bin/bash
# Second Rise — Daily check-in script
# Usage: ./checkin.sh

BASE="https://second-rise-production.up.railway.app/api"

# ── Saved tokens (update these after running setup-test-users.sh) ──
TOKEN_1="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjkyLCJpYXQiOjE3ODc3NTcxNTIsImV4cCI6MTc5MDM0OTE1Mn0.kssONcPGxrbsqHv4qpzJWZMPA8k9sFv_KVLwpWh83jM"   # user1@secondrise.app
TOKEN_2="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjkzLCJpYXQiOjE3ODc3NTcxNTIsImV4cCI6MTc5MDM0OTE1Mn0.GDK6nl9dY45AZVBZrD8yZlDABfDy88oBJNNanAgzEmw"   # user2@secondrise.app
TOKEN_3="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjczLCJpYXQiOjE3ODc3NTczNDcsImV4cCI6MTc5MDM0OTM0N30.8s0RM7SM3kSkOqEbjt0xh3O6yNpxQ08QvOOkdip7PqU"   # user3@secondrise.app
TOKEN_4="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk0LCJpYXQiOjE3ODc3NTcxNTIsImV4cCI6MTc5MDM0OTE1Mn0.u69LCUKo91dpvM-NnDGvggSv8Ag9iMIqUTGVbHe6G-A"   # user4@secondrise.app
TOKEN_5="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk1LCJpYXQiOjE3ODc3NTcxNTIsImV4cCI6MTc5MDM0OTE1Mn0.4VNj8KIJ9Lt5jtJO4lRYjad3bAYDa6smzJr3M1t_dMs"   # user5@secondrise.app

# ── Pick person ──────────────────────────────────────────────────────
echo ""
echo "Who are you checking in?"
echo "  1) User 1"
echo "  2) User 2"
echo "  3) User 3"
echo "  4) User 4"
echo "  5) User 5"
echo "  6) Enter token manually"
read -p "Person (1-6): " PERSON

case $PERSON in
  1) TOKEN=$TOKEN_1 ;;
  2) TOKEN=$TOKEN_2 ;;
  3) TOKEN=$TOKEN_3 ;;
  4) TOKEN=$TOKEN_4 ;;
  5) TOKEN=$TOKEN_5 ;;
  6) read -p "Paste token: " TOKEN ;;
  *) echo "Invalid"; exit 1 ;;
esac

if [ -z "$TOKEN" ]; then
  echo "❌ No token saved for that person. Add it to the TOKEN_X lines in checkin.sh"
  exit 1
fi

# ── Energy ───────────────────────────────────────────────────────────
echo ""
echo "1. Energy?"
echo "  1 = 💀 Wrecked"
echo "  2 = 😐 Meh"
echo "  3 = ✊ Solid"
echo "  4 = 🔥 Strong"
read -p "Energy (1-4): " E
case $E in
  1) ENERGY=20 ;;
  2) ENERGY=40 ;;
  3) ENERGY=65 ;;
  4) ENERGY=85 ;;
  *) echo "Invalid"; exit 1 ;;
esac

# ── Time ─────────────────────────────────────────────────────────────
echo ""
echo "2. Time available?"
echo "  1 = 10 min"
echo "  2 = 20 min"
echo "  3 = 30+ min"
read -p "Time (1-3): " T
case $T in
  1) TIME=10 ;;
  2) TIME=20 ;;
  3) TIME=30 ;;
  *) echo "Invalid"; exit 1 ;;
esac

# ── Pain ─────────────────────────────────────────────────────────────
echo ""
echo "3. Pain or soreness?"
echo "  1 = Upper body (shoulders, neck, arms)"
echo "  2 = Lower body (knees, hips, back, feet)"
echo "  3 = Core/abdomen"
echo "  4 = None"
read -p "Pain (1-4): " P
case $P in
  1) PAIN_FLAGGED=true;  PAIN_FLAGS='"Shoulders"' ;;
  2) PAIN_FLAGGED=true;  PAIN_FLAGS='"Knees"' ;;
  3) PAIN_FLAGGED=true;  PAIN_FLAGS='"Core/Abdominal"' ;;
  4) PAIN_FLAGGED=false; PAIN_FLAGS='' ;;
  *) echo "Invalid"; exit 1 ;;
esac

# ── Preference ───────────────────────────────────────────────────────
echo ""
echo "4. What sounds good today?"
echo "  1 = 🧘 Yoga / stretch"
echo "  2 = 💪 Strength"
echo "  3 = 🚶 Walk / low-impact cardio"
echo "  4 = 🎲 Surprise me"
read -p "Preference (1-4): " PR
case $PR in
  1) PREF="yoga" ;;
  2) PREF="strength" ;;
  3) PREF="walk" ;;
  4) PREF="surprise" ;;
  *) echo "Invalid"; exit 1 ;;
esac

DATE=$(date +%Y-%m-%d)

# ── Submit check-in ──────────────────────────────────────────────────
echo ""
echo "Submitting check-in..."
CHECKIN_RESP=$(curl -s -X POST "$BASE/checkin" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"layer1_energy\": $ENERGY, \"layer1_time_avail\": $TIME, \"pain_flagged\": $PAIN_FLAGGED, \"body_map_flags\": [$PAIN_FLAGS], \"workout_preference\": \"$PREF\", \"localDate\": \"$DATE\"}")

CHECKIN_ERROR=$(echo "$CHECKIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',''))" 2>/dev/null)
if [ ! -z "$CHECKIN_ERROR" ]; then
  echo "❌ Check-in failed: $CHECKIN_ERROR"
  echo "Raw: $CHECKIN_RESP"
  exit 1
fi

# ── Get recommendation ───────────────────────────────────────────────
echo "Getting recommendation..."
RESPONSE=$(curl -s "$BASE/recommend?localDate=$DATE" -H "Authorization: Bearer $TOKEN")

# Check for API error first
REC_ERROR=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',''))" 2>/dev/null)
if [ ! -z "$REC_ERROR" ]; then
  echo "❌ Recommendation failed: $REC_ERROR"
  echo "Raw: $RESPONSE"
  exit 1
fi

# Parse with Python (handles escaped chars, nested JSON, apostrophes)
TITLE=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('primary_workout',{}).get('title',''))" 2>/dev/null)
YOUTUBE=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('primary_workout',{}).get('youtube_id',''))" 2>/dev/null)
DURATION=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('primary_workout',{}).get('duration_min',''))" 2>/dev/null)
REASONING=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('primary_reasoning',''))" 2>/dev/null)
WEIGHT=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('primary_workout',{}).get('weight_note','') or '')" 2>/dev/null)

# ── WhatsApp message ─────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 COPY THIS TO WHATSAPP:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Your workout today:"
echo "*${TITLE}* (${DURATION} min)"
echo "▶️ https://youtu.be/${YOUTUBE}"
echo ""
echo "${REASONING}"
if [ ! -z "$WEIGHT" ]; then
  echo ""
  echo "${WEIGHT}"
fi
echo ""
echo "Reply *DONE* when you finish 💪"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
