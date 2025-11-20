(function () {
    // -------- SUPABASE CONFIG & GLOBALS --------
    
    const SUPABASE_URL = "https://icdgpzxtdqtucjqmpddk.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljZGdwenh0ZHF0dWNqcW1wZGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDA2NjUsImV4cCI6MjA3OTExNjY2NX0.LtOa91c2ego_TeNLKM7HUdV2ov8P4pUQ03nCeavR0Ow";
    
    let supabase = null;
    let myGameId = null;
    let myPlayerId = null;
    let isMultiplayer = false;
    let isHost = false;
    let currentAvatarSeed = null;
    let myChosenAvatar = null; // Store the avatar chosen in lobby
    let playerGender = 'male'; // Store player gender (male/female)
    let backgroundMusic = null;
    let isMusicPlaying = false;
    let musicInitialized = false;
    let hasShownMusicAlert = false;

    // -------- MYSTICAL ENHANCEMENTS --------
    
    // Floating Particles
    function initParticles() {
        const container = document.getElementById('particles-container');
        if (!container) return;
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 20}s`;
            particle.style.animationDuration = `${15 + Math.random() * 10}s`;
            container.appendChild(particle);
        }
    }

    // Background Music
    function initBackgroundMusic() {
        const musicBtn = document.getElementById('musicToggle');
        if (!musicBtn) return;

        // Fantasy/Epic mystical music - not elevator music!
        const musicUrls = [
            'https://cdn.pixabay.com/audio/2023/10/30/audio_c20bb90682.mp3', // Fantasy Dream - magical atmosphere
            'https://cdn.pixabay.com/audio/2022/11/22/audio_0c8cb1d87e.mp3', // Epic Fantasy
            'https://cdn.pixabay.com/audio/2023/02/28/audio_c6b8c9f8f7.mp3'  // Mystical Journey
        ];

        let currentMusicIndex = 0;
        
        function tryLoadMusic() {
            if (currentMusicIndex >= musicUrls.length) {
                console.log('Could not load any music source');
                return;
            }
            
            backgroundMusic = new Audio(musicUrls[currentMusicIndex]);
            backgroundMusic.loop = true;
            backgroundMusic.volume = 0.25;
            
            backgroundMusic.addEventListener('error', () => {
                console.log(`Music source ${currentMusicIndex} failed, trying next...`);
                currentMusicIndex++;
                tryLoadMusic();
            });
            
            backgroundMusic.addEventListener('canplaythrough', () => {
                console.log('Music loaded successfully');
                musicInitialized = true;
            });
        }

        musicBtn.addEventListener('click', () => {
            // Initialize music on first click (required for browser autoplay policy)
            if (!musicInitialized) {
                tryLoadMusic();
                // Give it a moment to load
                setTimeout(() => {
                    if (backgroundMusic && musicInitialized) {
                        attemptPlay();
                    } else if (!hasShownMusicAlert) {
                        alert('לא ניתן להפעיל מוזיקה. ייתכן שהדפדפן חוסם הפעלה אוטומטית.\n\nלחץ שוב להפעלת מוזיקה');
                        hasShownMusicAlert = true;
                    }
                }, 500);
                return;
            }

            if (isMusicPlaying) {
                backgroundMusic.pause();
                musicBtn.classList.add('muted');
                musicBtn.textContent = '🔇';
                isMusicPlaying = false;
            } else {
                attemptPlay();
            }
        });

        function attemptPlay() {
            if (!backgroundMusic) {
                console.log('Music not initialized yet');
                return;
            }
            
            backgroundMusic.play()
                .then(() => {
                    console.log('Music playing');
                    musicBtn.classList.remove('muted');
                    musicBtn.textContent = '🔊';
                    isMusicPlaying = true;
                })
                .catch(e => {
                    console.log('Music play failed:', e);
                    if (!hasShownMusicAlert) {
                        alert('לא ניתן להפעיל מוזיקה. ייתכן שהדפדפן חוסם הפעלה אוטומטית.');
                        hasShownMusicAlert = true;
                    }
                });
        }
    }

    // Avatar System - Fantasy Creatures
    const fantasyCreatures = [
        'dragon', 'unicorn', 'phoenix', 'griffin', 'wizard', 'witch',
        'fairy', 'mermaid', 'centaur', 'pegasus', 'elf', 'dwarf',
        'goblin', 'troll', 'orc', 'knight', 'sorceress', 'warlock',
        'demon', 'angel', 'vampire', 'werewolf', 'necromancer', 'druid'
    ];

    function generateAvatarUrl(seed, gender = null) {
        // Using DiceBear with "adventurer" style - fantasy cartoon characters
        // This API is free and works without API key
        // sex parameter is not supported in adventurer style, but we keep the logic for future
        return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=1a0b2e&scale=85`;
    }

    function randomizeAvatar() {
        // Get selected gender
        const genderRadio = document.querySelector('input[name="gender"]:checked');
        if (genderRadio) {
            playerGender = genderRadio.value;
        }
        
        // Pick a random fantasy creature name as seed
        const creature = fantasyCreatures[Math.floor(Math.random() * fantasyCreatures.length)];
        currentAvatarSeed = creature + Math.random().toString(36).substring(7);
        const avatarImg = document.getElementById('playerAvatar');
        if (avatarImg) {
            const avatarUrl = generateAvatarUrl(currentAvatarSeed, playerGender);
            avatarImg.src = avatarUrl;
            myChosenAvatar = avatarUrl; // Save the chosen avatar
        }
    }

    function initAvatarSystem() {
        randomizeAvatar(); // Initial avatar
        
        const randomBtn = document.getElementById('randomizeAvatar');
        if (randomBtn) {
            randomBtn.addEventListener('click', randomizeAvatar);
        }
    }
    
    // פונקציית אתחול לקוח (תיקרא כשהמשתמש לוחץ על כפתור יצירה/הצטרפות)
    function initSupabase(url, key) {
        if (supabase) return;
        // בדוק אם ה-UMD נטען (supabase) או window.createClient
        // ה-UMD של supabase-js@2 בדרך כלל חושף את 'supabase' או 'createClient' ב-global scope.
        // לרוב: window.supabase.createClient
        
        if (window.supabase && window.supabase.createClient) {
             supabase = window.supabase.createClient(url, key);
        } else if (window.createClient) {
             supabase = window.createClient(url, key);
        } else {
            console.error("Supabase client library not loaded or not found on window object");
            alert("שגיאה: ספריית Supabase לא נטענה. נסה לרענן את הדף.");
            return;
        }
    }

    const colors = ["red", "yellow", "green", "blue"];
    const colorNamesHeb = {
      red: "אדום",
      yellow: "צהוב",
      green: "ירוק",
      blue: "כחול",
    };
  
    let state = {
      numPlayers: 0,
      players: [],
      scores: [],
      playerAvatars: [], // אווטרים של שחקנים
      playerGenders: [], // מינים של שחקנים (male/female)
      targetScore: 3, // יעד נקודות לניצחון (ברירת מחדל)
      currentPlayerIndex: 0,
      targetColor: null,
      deck: [],
      row: [],
      arrowCard: null,
      pendingCard: null,
      lastPlacerIndex: null,
      revealed: false,
      gameOver: false,
      roundWinnerIndex: null, // מי ניצח בסיבוב - הוא יתחיל את הסיבוב הבא
    };
    
    let transitionTimerInterval = null;
  
    const $ = (id) => document.getElementById(id);
  
    function setMessage(text) {
      $("message").textContent = text;
    }
  
    function renderPlayersDisplay() {
      const container = $("playersDisplay");
      if (!container) return;
      
      container.innerHTML = "";
      
      state.players.forEach((name, idx) => {
        const card = document.createElement("div");
        card.className = "player-card";
        if (idx === state.currentPlayerIndex) {
          card.classList.add("current-turn");
        }
        
        // Avatar
        const avatarFrame = document.createElement("div");
        avatarFrame.className = "player-card-avatar";
        const avatarImg = document.createElement("img");
        avatarImg.src = state.playerAvatars[idx] || generateAvatarUrl(name);
        avatarImg.alt = name;
        avatarFrame.appendChild(avatarImg);
        card.appendChild(avatarFrame);
        
        // Name
        const nameDiv = document.createElement("div");
        nameDiv.className = "player-card-name";
        nameDiv.textContent = name;
        card.appendChild(nameDiv);
        
        // Score
        const scoreDiv = document.createElement("div");
        scoreDiv.className = "player-card-score";
        scoreDiv.textContent = `${state.scores[idx]}/${state.targetScore} נק'`;
        card.appendChild(scoreDiv);
        
        container.appendChild(card);
      });
    }
  
    function updateScoreboard() {
      // Use the new players display instead
      renderPlayersDisplay();
      
      // Keep old scoreboard for compatibility (hidden)
      const sb = $("scoreboard");
      if (sb) {
        sb.innerHTML = "";
        state.players.forEach((name, idx) => {
          const span = document.createElement("span");
          span.textContent = `${name}: ${state.scores[idx]} נק'`;
          if (idx === state.currentPlayerIndex) {
            span.classList.add("current");
          }
          sb.appendChild(span);
        });
      }
    }
  
    function updateCurrentPlayerLabel() {
      // This is now handled by renderPlayersDisplay
      const cp = $("currentPlayer");
      if (cp) {
        cp.textContent = `תור: ${state.players[state.currentPlayerIndex]}`;
      }
    }
  
    // -------- יצירת קלפים: קודם מציירים, אחר כך מודדים --------

    const palette = {
      red: "#e53935",
      yellow: "#ffeb3b",
      green: "#43a047",
      blue: "#1e88e5",
      white: "#fafafa" // רקע
    };
    
    // המרת HEX ל-RGB להשוואה מהירה
    function hexToRgb(hex) {
      const bigint = parseInt(hex.slice(1), 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    }

    const paletteRgb = {};
    for (const key in palette) {
      paletteRgb[key] = hexToRgb(palette[key]);
    }

    function generateCardShapes(width, height) {
      const shapes = [];
      // מספר צורות משתנה
      const numShapes = 25 + Math.floor(Math.random() * 25);
      
      // קביעת משקלים לצבעים כדי לייצר קלפים מגוונים (לא תמיד 25% לכולם)
      const weights = {};
      let totalWeight = 0;
      colors.forEach(c => {
          // משקל בסיסי אקראי
          weights[c] = Math.random();
          // סיכוי של 30% לקבל "בוסט" לצבע מסוים שיהיה דומיננטי
          if (Math.random() < 0.3) weights[c] += 2;
          totalWeight += weights[c];
      });

      const pickColor = () => {
          let r = Math.random() * totalWeight;
          for (const c of colors) {
              if (r < weights[c]) return c;
              r -= weights[c];
          }
          return colors[colors.length - 1];
      };

      for (let i = 0; i < numShapes; i++) {
        shapes.push({
          color: pickColor(),
          type: Math.floor(Math.random() * 3), // 0: rect, 1: ellipse, 2: triangle
          x: Math.random() * width,
          y: Math.random() * height,
          size: (Math.min(width, height) * 0.1) + (Math.random() * Math.min(width, height) * 0.4),
          rotation: Math.random() * Math.PI * 2,
          r1: Math.random(), // פרמטרים אקראיים נוספים לצורה
          r2: Math.random()
        });
      }
      return shapes;
    }

    function roundRect(ctx, x, y, w, h, r) {
      const minR = Math.min(w, h) / 2;
      if (r > minR) r = minR;
    
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    function drawCardArt(canvas, card) {
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;

      // ציור רקע
      ctx.fillStyle = palette.white;
      ctx.fillRect(0, 0, w, h);

      if (!card.shapes) return;

      card.shapes.forEach(shape => {
        ctx.fillStyle = palette[shape.color];
        ctx.save();
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.rotation);

        const size = shape.size;
        
        ctx.beginPath();
        if (shape.type === 0) {
            // מלבן מעוגל
            const rw = size * (0.5 + shape.r1 * 0.8);
            const rh = size * (0.4 + shape.r2 * 0.6);
            const r = Math.min(rw, rh) / 4;
            roundRect(ctx, -rw/2, -rh/2, rw, rh, r);
        } else if (shape.type === 1) {
            // אליפסה
            ctx.ellipse(0, 0, size * 0.6, size * 0.4 * (0.8 + shape.r1 * 0.4), 0, 0, Math.PI * 2);
        } else {
            // משולש
            ctx.moveTo(0, -size * 0.5);
            ctx.lineTo(size * 0.5, size * 0.4);
            ctx.lineTo(-size * 0.5, size * 0.4);
            ctx.closePath();
        }
        ctx.fill();
        ctx.restore();
      });
    }

    function estimateColorPercentsFromCanvas(canvas) {
      const ctx = canvas.getContext("2d");
      const { width, height } = canvas;
      const data = ctx.getImageData(0, 0, width, height).data;
      const counts = { red: 0, yellow: 0, green: 0, blue: 0 };
      let countedPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        let bestColor = null;
        let bestDist = Infinity;

        // בדיקה מול 4 צבעי המשחק
        for (const c of colors) {
          const [cr, cg, cb] = paletteRgb[c];
          const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
          if (d < bestDist) {
            bestDist = d;
            bestColor = c;
          }
        }

        // בדיקה מול הרקע הלבן
        const [wr, wg, wb] = paletteRgb.white;
        const whiteDist = (r - wr) ** 2 + (g - wg) ** 2 + (b - wb) ** 2;

        // אם זה קרוב יותר ללבן מאשר לצבע הכי קרוב שנמצא - זה רקע
        // או אם המרחק לצבע הכי קרוב עדיין גדול מדי (למשל אנטי-אליאסינג קיצוני)
        if (whiteDist < bestDist) {
          continue; // פיקסל רקע, לא נספר
        }
        
        counts[bestColor]++;
        countedPixels++;
      }

      const percents = {};
      if (countedPixels === 0) {
          // מקרה קצה (לא אמור לקרות): הכל לבן
          colors.forEach(c => percents[c] = 0);
      } else {
          colors.forEach(c => {
            percents[c] = Math.round((counts[c] / countedPixels) * 100);
          });
      }
      
      // תיקון עיגול ל-100%
      let sum = colors.reduce((acc, c) => acc + percents[c], 0);
      if (sum !== 100 && sum !== 0) {
          // מוסיפים/מחסירים את ההפרש מהצבע הכי דומיננטי כדי לא לפגוע בקטנים
          const dominant = colors.reduce((a, b) => percents[a] > percents[b] ? a : b);
          percents[dominant] += (100 - sum);
      }

      return percents;
    }

    function createRandomCard(id) {
        // 1. יצירת הגדרה גרפית (צורות)
        const width = 120;
        const height = 180;
        const shapes = generateCardShapes(width, height);

        // 2. ציור על קנבס זמני
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        // אובייקט זמני לציור
        const tempCard = { shapes }; 
        drawCardArt(tempCanvas, tempCard);

        // 3. מדידת אחוזים אמיתית
        const percents = estimateColorPercentsFromCanvas(tempCanvas);

        // 4. החזרת הקלף השלם
        return { id, shapes, percents };
    }

    function generateDeck(size = 50) {
      const deck = [];
      for (let i = 0; i < size; i++) {
        deck.push(createRandomCard(i));
      }
      // ערבוב החפיסה
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      return deck;
    }
  
    // -------- DOM של קלף --------
  
    function createCardElement(card, small = false) {
      const cardDiv = document.createElement("div");
      cardDiv.className = "card" + (small ? " small" : "");
  
      const front = document.createElement("div");
      front.className = "card-front";
  
      const canvas = document.createElement("canvas");
      canvas.width = 120;
      canvas.height = 180;
      canvas.className = "card-canvas";
      front.appendChild(canvas);
  
      drawCardArt(canvas, card);
  
      const back = document.createElement("div");
      back.className = "card-back";
  
      // כותרת אחוזים
      const title = document.createElement("div");
      title.className = "card-label";
      title.textContent = "תוצאות:";
      back.appendChild(title);
  
      // יצירת שורות עם גרפים
      const palette = {
          red: "#e53935",
          yellow: "#ffeb3b",
          green: "#43a047",
          blue: "#1e88e5",
      };

      colors.forEach((c) => {
        const percent = card.percents[c];
        
        const row = document.createElement("div");
        row.className = "percent-row";

        const textRow = document.createElement("div");
        textRow.className = "percent-text";
        
        const nameSpan = document.createElement("span");
        nameSpan.textContent = colorNamesHeb[c];
        
        const valSpan = document.createElement("span");
        valSpan.textContent = `${percent}%`;

        textRow.appendChild(nameSpan);
        textRow.appendChild(valSpan);
        row.appendChild(textRow);

        const barBg = document.createElement("div");
        barBg.className = "progress-bar-bg";
        
        const barFill = document.createElement("div");
        barFill.className = "progress-bar-fill";
        barFill.style.width = `${percent}%`;
        barFill.style.backgroundColor = palette[c];
        
        barBg.appendChild(barFill);
        row.appendChild(barBg);

        back.appendChild(row);
      });
  
      cardDiv.appendChild(front);
      cardDiv.appendChild(back);
      return cardDiv;
    }
  
    function renderArrowCard() {
      const container = $("arrowCardContainer");
      container.innerHTML = "";
      if (!state.arrowCard) return;
      const c = state.targetColor;
      const card = document.createElement("div");
      card.className = "arrow-card";
      
      // Simple arrow triangle pointing LEFT
      const arrow = document.createElement("div");
      arrow.className = "arrow-shape arrow-" + c;
      // No rotation needed - arrow-shape already points left with rotate(-90deg) in CSS
      card.appendChild(arrow);
  
      const label = document.createElement("div");
      label.className = "arrow-card-label";
      label.textContent = colorNamesHeb[c];
      card.appendChild(label);
  
      container.appendChild(card);
    }
  
    function renderNextCard() {
      const container = $("nextCardContainer");
      container.innerHTML = "";
      if (state.deck.length === 0) {
        container.textContent = "אין קלפים נוספים";
        return;
      }
      
      // הצגת הקלף הבא אם זה התור שלי
      const isMyTurn = (state.currentPlayerIndex === getMyPlayerIndex());
      
      // גם אם זה לא התור שלי, אני רואה את הקלף הבא, אבל לא יכול לגרור אותו.
      // או שאולי כולם רואים? כן, זה מידע גלוי.
      
      const card = state.deck[0];
      const el = createCardElement(card, true);
      
      // הוספת יכולת גרירה רק אם זה התור שלי ואין קלף תלוי כבר
      if (isMyTurn && !state.pendingCard && !state.gameOver) {
        el.setAttribute("draggable", "true");
        el.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", "card");
            e.dataTransfer.effectAllowed = "move";
            // אפשר להוסיף מחלקה ויזואלית לשורה כדי לסמן שאפשר לגרור
            document.querySelectorAll(".slot").forEach(s => s.classList.add("highlight-target"));
        });
        el.addEventListener("dragend", () => {
             document.querySelectorAll(".slot").forEach(s => s.classList.remove("highlight-target"));
        });
      } else {
          el.style.cursor = "default";
          el.style.opacity = isMyTurn ? "1" : "0.8"; // ויזואלי קטן
      }

      container.appendChild(el);
    }
  
    function renderRow(problematicCardIndex = -1) {
      const rowDiv = $("row");
      rowDiv.innerHTML = "";
  
      // In RTL flow: First Element is Rightmost, Last Element is Leftmost.
      // We want Right = Low, Left = High.
  
      const numSlots = state.row.length + 1;
      const isMyTurn = (state.currentPlayerIndex === getMyPlayerIndex());
      
      // Add 'many-cards' class after 2 cards to shrink slots and hide labels
      if (state.row.length > 2) {
        rowDiv.classList.add("many-cards");
      } else {
        rowDiv.classList.remove("many-cards");
      }
  
      for (let i = 0; i < numSlots; i++) {
        // --- Create Slot ---
        const slot = document.createElement("div");
        slot.className = "slot";
        slot.dataset.index = i;
        
        // הסלוטים פעילים לגרירה תמיד אם זה התור שלי
        if (isMyTurn && !state.gameOver) {
            slot.addEventListener("dragover", (e) => {
                e.preventDefault(); // חובה כדי לאפשר drop
                e.dataTransfer.dropEffect = "move";
                slot.classList.add("drag-over");
            });
            slot.addEventListener("dragleave", () => {
                slot.classList.remove("drag-over");
            });
            slot.addEventListener("drop", (e) => {
                e.preventDefault();
                slot.classList.remove("drag-over");
                const data = e.dataTransfer.getData("text/plain");
                if (data === "card") {
                    placePendingCardAt(i);
                }
            });
            
            // תמיכה גם בלחיצה למי שלא יכול לגרור (נגישות / מובייל ישן)
            slot.addEventListener("click", () => {
                if (confirm("האם להניח את הקלף כאן?")) {
                    placePendingCardAt(i);
                }
            });
        }

        // Add labels
        const label = document.createElement("div");
        label.className = "slot-label";
        if (i === 0) {
            label.textContent = "נמוך יותר";
        } else if (i === numSlots - 1) {
            label.textContent = "גבוה יותר";
        }
        slot.appendChild(label);

        // אם נבחר כבר קלף (מנגנון ישן), נשאיר את זה, אבל עדיף גרירה
        // ביטלתי את state.pendingCard כמצב ביניים, הפעולה היא מיידית בגרירה.
        
        rowDiv.appendChild(slot);
  
        // --- Create Card (if not the last slot) ---
        if (i < state.row.length) {
          const cardData = state.row[i];
          const cardEl = createCardElement(cardData);
          if (state.revealed) {
            cardEl.classList.add("revealed");
            
            // Add flip-on-click functionality
            cardEl.style.cursor = "pointer";
            cardEl.addEventListener("click", (e) => {
              e.stopPropagation(); // Don't trigger slot click
              cardEl.classList.toggle("flipped");
            });
          }
          // הדגשת קלף בעייתי
          if (i === problematicCardIndex) {
            cardEl.classList.add("problematic");
          }
          rowDiv.appendChild(cardEl);
        }
      }
  
      // Update scroll map after rendering
      setTimeout(() => updateScrollMap(), 100);
      
      // עדכון הודעה אם צריך
    }
    
    // -------- Auto-scroll to newly placed card --------
    
    function scrollToCard(cardIndex) {
      const rowEl = $("row");
      if (!rowEl) return;
      
      // Find all card elements in the row
      const cards = rowEl.querySelectorAll('.card');
      if (cardIndex >= cards.length) return;
      
      const cardEl = cards[cardIndex];
      
      // Scroll so the card is centered in the viewport
      cardEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center' // Center the card horizontally
      });
    }
    
    function highlightNewCard(cardIndex) {
      const rowEl = $("row");
      if (!rowEl) return;
      
      const cards = rowEl.querySelectorAll('.card');
      if (cardIndex >= cards.length) return;
      
      const cardEl = cards[cardIndex];
      
      // Add a temporary highlight class
      cardEl.classList.add('newly-placed');
      
      // Remove it after 1 second
      setTimeout(() => {
        cardEl.classList.remove('newly-placed');
      }, 1000);
    }
  
    // -------- לוגיקת משחק --------
  
    function initGame(numPlayers, names) {
      state.numPlayers = numPlayers;
      state.players = names;
      state.scores = new Array(numPlayers).fill(0);
      state.currentPlayerIndex = 0;
      state.gameOver = false;
      
      // Generate avatars and genders for each player
      state.playerAvatars = names.map((name, idx) => {
        // Use the chosen avatar for the first player (me)
        if (idx === 0 && myChosenAvatar) {
          return myChosenAvatar;
        }
        // Generate random avatars for other players
        const creature = fantasyCreatures[Math.floor(Math.random() * fantasyCreatures.length)];
        const seed = creature + name + Math.random().toString(36).substring(7);
        return generateAvatarUrl(seed);
      });
      
      // Set genders (first player uses selected gender, others random)
      state.playerGenders = names.map((name, idx) => {
        if (idx === 0) {
          return playerGender; // Use selected gender
        }
        // Random gender for other players
        return Math.random() < 0.5 ? 'male' : 'female';
      });
      
      startRound();
    }
  
    function startRound() {
      state.deck = generateDeck(40);
      state.row = [];
      state.revealed = false;
      state.pendingCard = null;
      state.lastPlacerIndex = null;
  
      const color = colors[Math.floor(Math.random() * colors.length)];
      state.targetColor = color;
      state.arrowCard = { color };
  
      const first = state.deck.shift();
      state.row.push(first);
  
      $("statusPanel").style.display = "block";
      $("playArea").style.display = "block";
  
      renderArrowCard();
      renderNextCard();
      renderRow();
      updateScoreboard();
      updateCurrentPlayerLabel();
      setMessage(
        `צבע היעד הוא ${colorNamesHeb[color]}. הסדר בשורה: מימין (נמוך) לשמאל (גבוה).`
      );
      
      const challengeBtn = $("challengeBtn");
      const nextRoundBtn = $("nextRoundBtn");
      if (challengeBtn) challengeBtn.disabled = false;
      if (nextRoundBtn) nextRoundBtn.disabled = true;
    }
  
    function startTurn() {
      if (state.gameOver) return;
      state.pendingCard = null;
      state.revealed = false;
      renderNextCard();
      renderRow();
      updateScoreboard();
      updateCurrentPlayerLabel();
    }
  
    function nextPlayer() {
      state.currentPlayerIndex =
        (state.currentPlayerIndex + 1) % state.numPlayers;
      startTurn();
    }
  
    function onPlaceClicked() {
        // פונקציה זו כבר לא בשימוש ישיר של כפתור, כי עברנו לגרירה.
        // נשאיר אותה רק אם נרצה להוסיף כפתור נגישות בעתיד.
        alert("אנא גרור את הקלף למיקום הרצוי בשורה.");
    }
      
    function placePendingCardAt(index) {
        // שינוי: הפונקציה נקראת ישירות ללא state.pendingCard כמצב ביניים
        const cardToPlace = state.deck[0]; // לוקחים ישירות מהחפיסה
        if (!cardToPlace) return;
        
        // מכניסים את הקלף לשורה
        state.row.splice(index, 0, cardToPlace);
        state.lastPlacerIndex = state.currentPlayerIndex;
      
        // מוציאים מהחפיסה
        state.deck.shift();
      
        state.pendingCard = null;
      
        renderNextCard();
        renderRow();
        
        // 🆕 Auto-scroll to the newly placed card and highlight it
        setTimeout(() => {
          scrollToCard(index);
          highlightNewCard(index);
          updateScrollMap(); // Update the scroll map indicator
        }, 100);
        
        nextPlayer();
      
        if (isMultiplayer) {
            updateRemoteGameState();
        }
    }
      
  
    function isRowCorrect() {
      const c = state.targetColor;
      for (let i = 0; i < state.row.length - 1; i++) {
        const a = state.row[i].percents[c];
        const b = state.row[i + 1].percents[c];
        if (a > b) return false;
      }
      return true;
    }

    // פונקציית קונפטי
    function launchConfetti(duration = 3000) {
      const canvas = $("confettiCanvas");
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles = [];
      const colors = ["#e53935", "#ffeb3b", "#43a047", "#1e88e5", "#ff6b6b", "#9c27b0"];

      for (let i = 0; i < 150; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 3 + 2,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10
        });
      }

      const startTime = Date.now();
      
      function animate() {
        const elapsed = Date.now() - startTime;
        if (elapsed > duration) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();

          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotationSpeed;
          p.vy += 0.1; // גרביטציה
        });

        requestAnimationFrame(animate);
      }

      animate();
    }

    // פונקציית הצגת פופאפ
    function showChallengePopup(rowWasCorrect, winnerName) {
      const popup = document.createElement("div");
      popup.className = "challenge-popup";

      const title = document.createElement("h2");
      // אם הרצף היה נכון, הערעור טעה (השחקן שהניח קלף מקבל נקודה)
      // אם הרצף היה שגוי, הערעור צדק (המערער מקבל נקודה)
      const challengeSucceeded = !rowWasCorrect;
      title.textContent = challengeSucceeded ? "✓ הערעור צדק!" : "✗ הערעור טעה!";
      
      const text = document.createElement("p");
      text.textContent = `${challengeSucceeded ? 'המערער צדק! ' : 'הרצף היה נכון! '}נקודה ל${winnerName}`;

      popup.appendChild(title);
      popup.appendChild(text);
      document.body.appendChild(popup);

      // הסרה אחרי 4 שניות
      setTimeout(() => {
        popup.classList.add("disappear");
        setTimeout(() => popup.remove(), 300);
      }, 4000);
    }

    // פונקציה למציאת הקלף הבעייתי
    function findProblematicCardIndex() {
      const c = state.targetColor;
      for (let i = 0; i < state.row.length - 1; i++) {
        const a = state.row[i].percents[c];
        const b = state.row[i + 1].percents[c];
        if (a > b) return i + 1; // הקלף הבעייתי הוא זה שמפר את הסדר
      }
      return -1;
    }
  
    function onChallengeClicked() {
      if (state.row.length <= 1) {
        setMessage("אין מספיק קלפים בשורה כדי לערער.");
        return;
      }
  
      state.revealed = true;
      const correct = isRowCorrect();
      const problematicIndex = !correct ? findProblematicCardIndex() : -1;
      
      // רינדור עם הדגשה של קלף בעייתי
      renderRow(problematicIndex);
  
      let winnerIndex;
      if (correct) {
        if (state.lastPlacerIndex == null) {
          setMessage("הרצף נכון, אבל אין שחקן אחרון שהניח קלף.");
          endRound(null);
          return;
        }
        winnerIndex = state.lastPlacerIndex;
        setMessage(`הרצף נכון! ${state.players[winnerIndex]} מקבל נקודה.`);
      } else {
        winnerIndex = state.currentPlayerIndex;
        setMessage(`נמצאה טעות ברצף. ${state.players[winnerIndex]} מקבל נקודה.`);
      }
  
      if (winnerIndex != null) {
        state.scores[winnerIndex] += 1;
        state.roundWinnerIndex = winnerIndex; // שמירת המנצח בסיבוב
      }
      updateScoreboard();

      // הצגת פופאפ וקונפטי
      showChallengePopup(correct, state.players[winnerIndex]);
      launchConfetti();
  
      if (state.scores[winnerIndex] >= state.targetScore) {
        state.gameOver = true;
        setMessage(
          `🎉 ${state.players[winnerIndex]} הגיע ל-${state.targetScore} נקודות וניצח את המשחק! 🎉`
        );
        $("challengeBtn").disabled = true;
        
        // Show end game screen after popup
        setTimeout(() => {
          showEndGameScreen(winnerIndex);
        }, 5000);
      } else {
        endRound(winnerIndex);
      }
    }
  
    function endRound(roundWinnerIndex) {
      const challengeBtn = $("challengeBtn");
      if (challengeBtn) challengeBtn.disabled = true;
      
      // הודעה לשחקנים
      setMessage(
        `${state.players[roundWinnerIndex]} ניצח בסיבוב! בדוק את הקלפים ולחץ "סיבוב הבא" כשאתה מוכן.`
      );
      
      // Initialize ready-for-next-round tracking
      if (!state.playersReadyForNextRound) {
        state.playersReadyForNextRound = [];
      }
      state.playersReadyForNextRound = []; // Reset
      
      // Show "Next Round" button for all players
      showNextRoundButton();
    }
    
    function showNextRoundButton() {
      const transitionDiv = $("roundTransition");
      const skipBtn = $("skipTransitionBtn");
      
      if (!transitionDiv) return;
      
      // Hide timer elements, show only button
      const timerDisplay = $("transitionTimer");
      const progressBar = $("transitionProgress");
      const timerText = transitionDiv.querySelector(".round-transition-text");
      
      if (timerDisplay) timerDisplay.style.display = "none";
      if (progressBar) progressBar.parentElement.style.display = "none";
      if (timerText) timerText.style.display = "none";
      
      transitionDiv.style.display = "block";
      skipBtn.textContent = "סיבוב הבא ⏭️";
      skipBtn.style.fontSize = "20px";
      skipBtn.style.padding = "15px 30px";
      
      // Button click - player marks themselves ready
      skipBtn.onclick = () => {
        onPlayerReadyForNextRound();
      };
    }
    
    async function onPlayerReadyForNextRound() {
      // Mark this player as ready
      const myPlayerIndex = state.players.indexOf(myPlayerName);
      if (myPlayerIndex === -1) return;
      
      if (!state.playersReadyForNextRound.includes(myPlayerIndex)) {
        state.playersReadyForNextRound.push(myPlayerIndex);
      }
      
      // Sync to all players
      if (isMultiplayer) {
        await updateRemoteGameState();
      }
      
      // Update button text
      const skipBtn = $("skipTransitionBtn");
      if (skipBtn) {
        skipBtn.textContent = `✓ אישרת (${state.playersReadyForNextRound.length}/${state.numPlayers})`;
        skipBtn.disabled = true;
      }
      
      // Check if all players are ready
      if (state.playersReadyForNextRound.length >= state.numPlayers) {
        startNextRound();
      }
    }
    
    async function startNextRound() {
      // Hide transition
      const transitionDiv = $("roundTransition");
      if (transitionDiv) {
        transitionDiv.style.display = "none";
      }
      
      // Reset ready tracking
      state.playersReadyForNextRound = [];
      
      // Re-enable button for next time
      const skipBtn = $("skipTransitionBtn");
      if (skipBtn) {
        skipBtn.disabled = false;
        skipBtn.textContent = "סיבוב הבא ⏭️";
      }
      
      // המנצח בסיבוב מתחיל
      if (state.roundWinnerIndex != null) {
        state.currentPlayerIndex = state.roundWinnerIndex;
      }
      
      startRound();
      const challengeBtn = $("challengeBtn");
      if (challengeBtn) challengeBtn.disabled = false;
      
      // Sync to all players
      if (isMultiplayer) {
        await updateRemoteGameState();
      }
    }
    
    function showEndGameScreen(winnerIndex) {
      // Create end game overlay
      const overlay = document.createElement("div");
      overlay.className = "end-game-overlay";
      overlay.id = "endGameOverlay";
      
      const content = document.createElement("div");
      content.className = "end-game-content";
      
      // Title
      const title = document.createElement("div");
      title.className = "end-game-title";
      title.textContent = "🎊 המשחק הסתיים! 🎊";
      content.appendChild(title);
      
      // Winner section
      const winnerDiv = document.createElement("div");
      winnerDiv.className = "end-game-winner";
      
      const trophy = document.createElement("div");
      trophy.className = "end-game-trophy";
      trophy.textContent = "🏆";
      winnerDiv.appendChild(trophy);
      
      const winnerAvatar = document.createElement("div");
      winnerAvatar.className = "end-game-winner-avatar";
      const winnerAvatarImg = document.createElement("img");
      winnerAvatarImg.src = state.playerAvatars[winnerIndex];
      winnerAvatarImg.alt = state.players[winnerIndex];
      winnerAvatar.appendChild(winnerAvatarImg);
      winnerDiv.appendChild(winnerAvatar);
      
      const winnerName = document.createElement("div");
      winnerName.className = "end-game-winner-name";
      winnerName.textContent = state.players[winnerIndex];
      winnerDiv.appendChild(winnerName);
      
      const winnerScore = document.createElement("div");
      winnerScore.className = "end-game-winner-score";
      winnerScore.textContent = `${state.scores[winnerIndex]} נקודות - מנצח!`;
      winnerDiv.appendChild(winnerScore);
      
      content.appendChild(winnerDiv);
      
      // Rankings
      const rankings = document.createElement("div");
      rankings.className = "end-game-rankings";
      
      const rankingsTitle = document.createElement("h3");
      rankingsTitle.textContent = "🎖️ טבלת מקומות";
      rankings.appendChild(rankingsTitle);
      
      // Sort players by score
      const playerRankings = state.players.map((name, idx) => ({
        name,
        score: state.scores[idx],
        avatar: state.playerAvatars[idx],
        index: idx
      })).sort((a, b) => b.score - a.score);
      
      playerRankings.forEach((player, position) => {
        const rankItem = document.createElement("div");
        rankItem.className = "ranking-item";
        
        const leftPart = document.createElement("div");
        leftPart.className = "ranking-left";
        
        const posDiv = document.createElement("div");
        posDiv.className = "ranking-position";
        const medals = ["🥇", "🥈", "🥉"];
        posDiv.textContent = medals[position] || `${position + 1}.`;
        leftPart.appendChild(posDiv);
        
        const rankAvatar = document.createElement("div");
        rankAvatar.className = "ranking-avatar";
        const rankAvatarImg = document.createElement("img");
        rankAvatarImg.src = player.avatar;
        rankAvatarImg.alt = player.name;
        rankAvatar.appendChild(rankAvatarImg);
        leftPart.appendChild(rankAvatar);
        
        const nameDiv = document.createElement("div");
        nameDiv.className = "ranking-name";
        nameDiv.textContent = player.name;
        leftPart.appendChild(nameDiv);
        
        rankItem.appendChild(leftPart);
        
        const scoreDiv = document.createElement("div");
        scoreDiv.className = "ranking-score";
        scoreDiv.textContent = `${player.score} נק'`;
        rankItem.appendChild(scoreDiv);
        
        rankings.appendChild(rankItem);
      });
      
      content.appendChild(rankings);
      
      // Buttons
      const buttonsDiv = document.createElement("div");
      buttonsDiv.className = "end-game-buttons";
      
      const newGameBtn = document.createElement("button");
      newGameBtn.textContent = "🎮 משחק חדש";
      newGameBtn.className = "btn-primary";
      newGameBtn.onclick = () => {
        overlay.remove();
        state.scores = new Array(state.numPlayers).fill(0);
        state.currentPlayerIndex = 0;
        state.gameOver = false;
        state.roundWinnerIndex = null;
        startRound();
      };
      buttonsDiv.appendChild(newGameBtn);
      
      content.appendChild(buttonsDiv);
      
      overlay.appendChild(content);
      document.body.appendChild(overlay);
      
      // Launch special confetti
      launchConfetti(5000);
      
      // Auto-cleanup: Delete game from DB after 60 seconds
      // This keeps the database clean and improves performance
      if (isMultiplayer && myGameId) {
        setTimeout(async () => {
          try {
            await supabase.from('games').delete().eq('id', myGameId);
            console.log('✅ Game cleaned up from database');
          } catch (error) {
            console.error('Failed to cleanup game:', error);
          }
        }, 60000); // 60 seconds = 1 minute
      }
    }
  
    // -------- Multiplayer Logic --------

    function getSupabaseConfig() {
        // In a real app, these would be env vars or user input
        // For now, we will prompt the user if they are still placeholders
        let url = SUPABASE_URL;
        let key = SUPABASE_ANON_KEY;
        
        if (url === "YOUR_SUPABASE_URL") {
            url = prompt("הכנס Supabase Project URL:");
        }
        if (key === "YOUR_SUPABASE_ANON_KEY") {
            key = prompt("הכנס Supabase Anon Key:");
        }
        return { url, key };
    }

    async function createGame() {
        const { url, key } = getSupabaseConfig();
        if (!url || !key) return;
        initSupabase(url, key);

        const playerName = $("myPlayerName").value.trim() || "שחקן אורח";
        const targetScore = parseInt($("targetScore").value, 10) || 3;
        state.targetScore = targetScore;
        
        myPlayerId = crypto.randomUUID();
        
        // Get gender and avatar
        const genderRadio = document.querySelector('input[name="gender"]:checked');
        const selectedGender = genderRadio ? genderRadio.value : 'male';
        playerGender = selectedGender; // Save globally
        
        const initialPlayers = [{
            id: myPlayerId,
            name: playerName,
            score: 0,
            isHost: true,
            avatar: myChosenAvatar || generateAvatarUrl('host' + myPlayerId.substring(0, 8)),
            gender: selectedGender
        }];

        const { data, error } = await supabase
            .from('games')
            .insert({
                status: 'waiting',
                host_id: myPlayerId,
                players: initialPlayers,
                state: {} // Empty initially
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase Insert Error:", error);
            $("lobbyMessage").textContent = "שגיאה ביצירת משחק: " + error.message + " (קוד: " + error.code + ")";
            return;
        }

        myGameId = data.id;
        isHost = true;
        isMultiplayer = true;
        
        $("lobby").style.display = "none";
        $("waitingRoom").style.display = "block";
        
        // Short Code Logic: Use first 6 chars of UUID
        const shortCode = myGameId.substring(0, 6);
        $("displayGameId").textContent = shortCode;
        
        subscribeToGame(myGameId);
        renderWaitingRoom(data);
    }

    async function joinGame() {
        const { url, key } = getSupabaseConfig();
        if (!url || !key) return;
        initSupabase(url, key);

        let gameIdInput = $("joinGameId").value.trim();
        if (!gameIdInput) {
            $("lobbyMessage").textContent = "יש להזין קוד משחק";
            return;
        }

        const playerName = $("myPlayerName").value.trim() || "שחקן אורח";
        myPlayerId = crypto.randomUUID();

        // אם המשתמש הכניס קוד קצר (6 תווים), נצטרך לחפש אותו ב-DB
        // מכיוון שלא הוספנו עמודה, נאלץ להשתמש בטריק:
        // או לבקש קוד מלא, או לסרוק (לא יעיל).
        // פתרון ביניים: נניח שהמשתמש מזין UUID מלא אם זה ארוך, ואם קצר - ננסה למצוא.
        // בגלל מגבלות זמן/DB, נבקש כרגע UUID מלא או שנעשה חיפוש "like".
        // UUID הוא string, אז אפשר לעשות: .like('id', `${input}%`)
        
        let actualGameId = gameIdInput;
        
        if (gameIdInput.length < 10) {
             // חיפוש ידני: משוך את כל המשחקים הממתינים וסנן בצד הלקוח
             // זה פתרון עוקף לבעיות חיפוש טקסט על שדה UUID
             const { data: waitingGames, error: listError } = await supabase
                .from('games')
                .select('id')
                .eq('status', 'waiting')
                .order('created_at', { ascending: false })
                .limit(50); // אופטימיזציה: רק ה-50 האחרונים

             if (listError || !waitingGames) {
                 console.error("Error listing games:", listError);
                 $("lobbyMessage").textContent = "שגיאה בחיפוש משחק";
                 return;
             }

             const found = waitingGames.find(g => g.id.startsWith(gameIdInput));
             
             if (found) {
                 actualGameId = found.id;
             } else {
                 $("lobbyMessage").textContent = "משחק לא נמצא (קוד קצר שגוי)";
                 return;
             }
        }

        // 1. Get current game data
        const { data: game, error } = await supabase
            .from('games')
            .select('*')
            .eq('id', actualGameId)
            .single();

        if (error || !game) {
            $("lobbyMessage").textContent = "משחק לא נמצא";
            return;
        }

        if (game.status !== 'waiting') {
             $("lobbyMessage").textContent = "המשחק כבר התחיל";
             return;
        }

        // 2. Add myself to players list (with avatar and gender)
        const genderRadio = document.querySelector('input[name="gender"]:checked');
        const selectedGender = genderRadio ? genderRadio.value : 'male';
        
        const players = game.players || [];
        players.push({
            id: myPlayerId,
            name: playerName,
            score: 0,
            isHost: false,
            avatar: myChosenAvatar || generateAvatarUrl('guest' + myPlayerId.substring(0, 8)),
            gender: selectedGender
        });

        const { error: updateError } = await supabase
            .from('games')
            .update({ players: players })
            .eq('id', actualGameId);

        if (updateError) {
            $("lobbyMessage").textContent = "שגיאה בהצטרפות: " + updateError.message;
            return;
        }

        myGameId = actualGameId;
        isHost = false;
        isMultiplayer = true;

        $("lobby").style.display = "none";
        $("waitingRoom").style.display = "block";
        // Display short code
        $("displayGameId").textContent = myGameId.substring(0, 6);
        $("btnStartMultiplayer").style.display = "none"; // Only host can start

        subscribeToGame(myGameId);
        renderWaitingRoom({ ...game, players }); // Optimistic render
    }

    function subscribeToGame(gameId) {
        console.log('🔌 Subscribing to game:', gameId);
        
        const channel = supabase
            .channel('games-all-changes')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'games'
            }, payload => {
                console.log('🔥 ANY CHANGE DETECTED:', payload);
                
                // Filter for our game only
                if (payload.new?.id !== gameId) {
                    console.log('⏭️ Skipping - different game');
                    return;
                }
                console.log('📡 RAW PAYLOAD:', payload);
                const newGame = payload.new;
                console.log('📡 Game status:', newGame.status, '| Full game:', newGame);
                
                if (newGame.status === 'waiting') {
                    console.log('⏳ Status: waiting - updating waiting room');
                    renderWaitingRoom(newGame);
                } else if (newGame.status === 'playing') {
                    console.log('🎮 Status: playing - checking waiting room...');
                    // Check if we're still in waiting room (game just started)
                    const waitingRoom = $("waitingRoom");
                    console.log('🔍 Waiting room element:', waitingRoom);
                    console.log('🔍 Waiting room display:', waitingRoom?.style.display);
                    
                    const isInWaitingRoom = waitingRoom && 
                                          (waitingRoom.style.display === "" || 
                                           waitingRoom.style.display === "block" || 
                                           getComputedStyle(waitingRoom).display !== "none");
                    
                    console.log('🔍 Is in waiting room?', isInWaitingRoom);
                    
                    if (isInWaitingRoom) {
                        console.log('✅ Starting game for guest...');
                        // Start game locally for guest
                        initMultiplayerGame(newGame);
                    } else {
                        console.log('🔄 Syncing game state during play...');
                        // Update game state during play
                        syncGameState(newGame);
                    }
                } else {
                    console.log('❓ Unknown status:', newGame.status);
                }
            })
            .subscribe((status) => {
                console.log('📞 Subscription status:', status);
            });
        
        console.log('✅ Subscription created:', channel);
    }

    function renderWaitingRoom(game) {
        const list = $("waitingPlayersList");
        list.innerHTML = "";
        game.players.forEach(p => {
            const div = document.createElement("div");
            div.textContent = p.name + (p.isHost ? " (מארח)" : "");
            list.appendChild(div);
        });
        
        if (isHost) {
            $("btnStartMultiplayer").disabled = game.players.length < 2;
            $("btnStartMultiplayer").onclick = () => startGameAsHost(game);
        }
    }

    async function startGameAsHost(game) {
        // Hide waiting room immediately
        $("waitingRoom").style.display = "none";
        $("lobby").style.display = "none";
        
        // Initialize local state logic
        const playerNames = game.players.map(p => p.name);
        const playerAvatars = game.players.map(p => p.avatar || generateAvatarUrl(p.name + p.id.substring(0, 8)));
        const playerGenders = game.players.map(p => p.gender || 'male');
        
        // Set up state with avatars and genders from DB
        state.numPlayers = playerNames.length;
        state.players = playerNames;
        state.scores = new Array(playerNames.length).fill(0);
        // Random first player for fairness!
        state.currentPlayerIndex = Math.floor(Math.random() * playerNames.length);
        state.gameOver = false;
        state.playerAvatars = playerAvatars;
        state.playerGenders = playerGenders;
        // targetScore is already set from createGame, but keep it
        // state.targetScore should already be set by the host
        
        startRound();

        // Update remote
        await updateRemoteGameState('playing');
    }

    function initMultiplayerGame(gameRow) {
        // Show loading screen
        $("loadingScreen").style.display = "flex";
        
        // Load state from remote
        state = gameRow.state;
        
        // Hide lobby, show game area
        $("lobby").style.display = "none";
        $("waitingRoom").style.display = "none";
        $("statusPanel").style.display = "block";
        $("playArea").style.display = "block";
        
        renderAll();
        
        // Hide loading screen after a brief moment (smooth transition)
        setTimeout(() => {
            $("loadingScreen").style.display = "none";
        }, 800);
    }

    function syncGameState(gameRow) {
        state = gameRow.state;
        renderAll();
        
        // Update next round button if players are waiting
        if (state.playersReadyForNextRound && state.playersReadyForNextRound.length > 0) {
            const skipBtn = $("skipTransitionBtn");
            const transitionDiv = $("roundTransition");
            
            if (skipBtn && transitionDiv && transitionDiv.style.display !== "none") {
                const myPlayerIndex = state.players.indexOf(myPlayerName);
                const iHaveClicked = state.playersReadyForNextRound.includes(myPlayerIndex);
                
                if (iHaveClicked) {
                    skipBtn.textContent = `✓ אישרת (${state.playersReadyForNextRound.length}/${state.numPlayers})`;
                    skipBtn.disabled = true;
                } else {
                    skipBtn.textContent = `סיבוב הבא ⏭️ (${state.playersReadyForNextRound.length}/${state.numPlayers} אישרו)`;
                    skipBtn.disabled = false;
                }
            }
        }
    }
    
    function renderAll() {
        renderArrowCard();
        renderNextCard();
        renderRow();
        updateScoreboard();
        updateCurrentPlayerLabel();
        
        // Update message based on turn
        const currentPlayerName = state.players[state.currentPlayerIndex];
        const isMyTurn = (state.currentPlayerIndex === getMyPlayerIndex());
        
        if (state.gameOver) {
             // Game over message is handled in logic, but let's refresh
             // We might need a separate field for 'message' in state if we want to sync it exactly
        } else {
            if (state.pendingCard) {
                 const isFemale = state.playerGenders && state.playerGenders[state.currentPlayerIndex] === 'female';
                 const action = isFemale ? 'בוחרת' : 'בוחר';
                 setMessage(isMyTurn ? "בחר מיקום בשורה..." : `${currentPlayerName} ${action} מיקום...`);
            } else {
                 const isFemale = state.playerGenders && state.playerGenders[state.currentPlayerIndex] === 'female';
                 const verb = isFemale ? 'מבצעת כעת את התור שלה' : 'מבצע כעת את תורו';
                 setMessage(isMyTurn ? "תורך! הנח קלף או ערער." : `${currentPlayerName} ${verb}`);
            }
        }
        
        // Enable/Disable controls based on turn
        const controlsDisabled = !isMyTurn || state.gameOver;
        const challengeBtn = $("challengeBtn");
        const nextRoundBtn = $("nextRoundBtn");
        if (challengeBtn) challengeBtn.disabled = controlsDisabled;
        if (nextRoundBtn) nextRoundBtn.disabled = !state.gameOver; // Anyone can press? Or only host? Let's say anyone for now or host.
    }

    function getMyPlayerIndex() {
        if (!isMultiplayer) return state.currentPlayerIndex; // fallback
        // Find index in state.players matching my name (simple matching)
        // Better: store player IDs in state. But current logic uses names array.
        // We will assume the order in state.players matches the order in games.players
        // We can find my index by myPlayerId in the games.players array, but we only have state.players (names) in the sync.
        // Let's assume names are unique or just pass the index from the waiting room order.
        // For this simple version, we'll match by name.
        const myName = $("myPlayerName").value.trim() || "שחקן אורח";
        return state.players.findIndex(name => name === myName);
    }

    // Wrapper to push updates after local actions
    async function updateRemoteGameState(status = 'playing') {
        if (!isMultiplayer) return;
        await supabase.from('games').update({
            state: state,
            status: status
        }).eq('id', myGameId);
    }

    // Hook into existing logic
    // We need to override the original functions or inject the update call
    // Since we are in the same scope, we can just add calls to updateRemoteGameState() at the end of actions.

    // We will wrap the original event listeners
    
    // -------- Scroll Management for Row --------
    
    function updateScrollMap() {
      const rowEl = $("row");
      const scrollMapIndicator = $("rowProgressIndicator");
      const scrollMapArrowRight = $("progressArrowRight");
      const scrollMapArrowLeft = $("progressArrowLeft");
      
      if (!rowEl || !scrollMapIndicator || !scrollMapArrowRight || !scrollMapArrowLeft) return;
      
      // 1. Calculate yellow width (how much of the row is visible)
      const visiblePercentage = (rowEl.clientWidth / rowEl.scrollWidth) * 100;
      scrollMapIndicator.style.width = `${visiblePercentage}%`;
      
      // 2. Calculate yellow position (where we are on the row)
      const scrollPos = Math.abs(rowEl.scrollLeft);
      const scrolledPastPercentage = (scrollPos / rowEl.scrollWidth) * 100;
      scrollMapIndicator.style.right = `${scrolledPastPercentage}%`;
      
      // 3. Calculate where yellow starts and ends on the bar
      const yellowRight = scrolledPastPercentage; // Right edge (RTL)
      const yellowLeft = scrolledPastPercentage + visiblePercentage; // Left edge (RTL)
      
      // 4. Enable/disable arrows based on whether yellow touches edges
      const touchingRightEdge = yellowRight < 1; // Yellow touches right edge?
      const touchingLeftEdge = yellowLeft > 99; // Yellow touches left edge?
      
      if (touchingRightEdge) {
        scrollMapArrowRight.classList.add("disabled");
      } else {
        scrollMapArrowRight.classList.remove("disabled");
      }
      
      if (touchingLeftEdge) {
        scrollMapArrowLeft.classList.add("disabled");
      } else {
        scrollMapArrowLeft.classList.remove("disabled");
      }
    }
    
    function initScrollMapScrolling() {
      const rowEl = $("row");
      const progressArrowRight = $("progressArrowRight");
      const progressArrowLeft = $("progressArrowLeft");
      
      if (!rowEl || !progressArrowRight || !progressArrowLeft) return;
      
      // Scroll right (toward start in RTL)
      progressArrowRight.addEventListener("click", () => {
        rowEl.scrollBy({ left: 300, behavior: "smooth" }); // positive = right in RTL
      });
      
      // Scroll left (toward end in RTL)
      progressArrowLeft.addEventListener("click", () => {
        rowEl.scrollBy({ left: -300, behavior: "smooth" }); // negative = left in RTL
      });
      
      // Mouse drag scrolling for desktop
      let isDragging = false;
      let startX = 0;
      let scrollLeft = 0;
      
      rowEl.addEventListener("mousedown", (e) => {
        // Only start drag if clicking on the row itself, not on cards
        if (e.target.closest('.card') || e.target.closest('.slot')) return;
        
        isDragging = true;
        rowEl.style.cursor = "grabbing";
        startX = e.pageX - rowEl.offsetLeft;
        scrollLeft = rowEl.scrollLeft;
        e.preventDefault(); // Prevent text selection
      });
      
      rowEl.addEventListener("mouseleave", () => {
        isDragging = false;
        rowEl.style.cursor = "grab";
      });
      
      rowEl.addEventListener("mouseup", () => {
        isDragging = false;
        rowEl.style.cursor = "grab";
      });
      
      rowEl.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - rowEl.offsetLeft;
        const walk = (x - startX) * 2; // Multiply for faster scroll
        rowEl.scrollLeft = scrollLeft - walk;
      });
      
      // Set initial cursor
      rowEl.style.cursor = "grab";
      
      // Update scroll map on scroll
      rowEl.addEventListener("scroll", updateScrollMap);
      
      // Update scroll map on window resize
      window.addEventListener("resize", updateScrollMap);
      
      // Initial update
      updateScrollMap();
    }

    function initMobileDropdown() {
      const dropdownSelected = document.getElementById('dropdownSelected');
      const dropdownOptions = document.getElementById('dropdownOptions');
      const options = document.querySelectorAll('.dropdown-option');
      const nativeSelect = document.getElementById('targetScore');
      
      if (!dropdownSelected || !dropdownOptions || !nativeSelect) return;
      
      // Toggle dropdown
      dropdownSelected.addEventListener('click', () => {
        dropdownOptions.classList.toggle('open');
      });
      
      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
          dropdownOptions.classList.remove('open');
        }
      });
      
      // Handle option selection
      options.forEach(option => {
        option.addEventListener('click', () => {
          const value = option.dataset.value;
          const text = option.textContent;
          
          // Update Custom Dropdown UI
          dropdownSelected.textContent = text;
          options.forEach(opt => opt.classList.remove('selected'));
          option.classList.add('selected');
          dropdownOptions.classList.remove('open');
          
          // Update Native Select (Hidden)
          nativeSelect.value = value;
          
          // Trigger change event manually if needed (for game logic)
          const event = new Event('change');
          nativeSelect.dispatchEvent(event);
        });
      });
    }
    
    // -------- אירועי Setup --------
    
    // Setup logic for local game
    $("createPlayersBtn").addEventListener("click", () => {
      let n = parseInt($("numPlayersInput").value, 10);
      if (isNaN(n) || n < 2) n = 2;
      if (n > 4) n = 4;
      $("numPlayersInput").value = n;
  
      const container = $("playersNames");
      container.innerHTML = "";
      for (let i = 0; i < n; i++) {
        const div = document.createElement("div");
        div.style.marginTop = "4px";
        const label = document.createElement("label");
        label.textContent = `שם שחקן ${i + 1}: `;
        const input = document.createElement("input");
        input.type = "text";
        input.value = `שחקן ${i + 1}`;
        input.id = `playerName${i}`;
        label.appendChild(input);
        div.appendChild(label);
        container.appendChild(div);
      }
      $("startGameBtn").disabled = false;
    });
  
    $("startGameBtn").addEventListener("click", () => {
      const n = parseInt($("numPlayersInput").value, 10);
      const names = [];
      for (let i = 0; i < n; i++) {
        const el = document.getElementById(`playerName${i}`);
        const val = (el && el.value.trim()) || `שחקן ${i + 1}`;
        names.push(val);
      }
      $("setup").style.display = "none";
      initGame(n, names);
    });

    // Multiplayer Buttons
    $("btnCreateGame").addEventListener("click", createGame);
    $("btnJoinGame").addEventListener("click", joinGame);

    // Game Actions
    $("challengeBtn").addEventListener("click", async () => {
        onChallengeClicked();
        if (isMultiplayer) await updateRemoteGameState();
    });

    // -------- INITIALIZATION --------
    // Initialize mystical features on page load
    document.addEventListener('DOMContentLoaded', () => {
        initParticles();
        // initBackgroundMusic(); // Disabled for performance optimization
        initAvatarSystem();
        initScrollMapScrolling();
        initMobileDropdown();
    });

    // If DOM is already loaded (script at end of body)
    if (document.readyState === 'loading') {
        // Still loading, wait for DOMContentLoaded
    } else {
        // DOM already loaded
        initParticles();
        // initBackgroundMusic(); // Disabled for performance optimization
        initAvatarSystem();
    }

  })();
  