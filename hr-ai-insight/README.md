# HR AI     

מערכת AI חכמה לניהול משאבי אנוש בעברית.

## 🚀 התחלה מהירה

### דרישות מקדימות
- Node.js 18+ 
- npm 9+

### התקנה

```bash
cd hr-ai-insight
npm install
```

### הרצה

```bash
npm run dev
```

האפליקציה תפתח אוטומטית בכתובת `http://localhost:4200`

## 🏗️ ארכיטקטורה

### מבנה הפרויקט

```
src/
├── app/
│   ├── core/                    # שירותים ליבתיים
│   │   └── services/
│   │       ├── auth.service.ts           # אימות משתמש (Mock)
│   │       ├── employee-lookup.service.ts # חיפוש עובדים
│   │       ├── employee-data.service.ts   # נתוני עובדים
│   │       └── cohere.service.ts         # עיבוד AI (Mock)
│   ├── features/                # פיצ'רים
│   │   └── chat/
│   │       ├── chat-shell.component.ts
│   │       └── components/
│   │           ├── header/
│   │           ├── chat-window/
│   │           ├── message-list/
│   │           ├── message-input/
│   │           └── employee-sidebar/
│   ├── models/                  # מודלים
│   │   └── index.ts
│   ├── shared/                  # קומפוננטות משותפות
│   │   └── components/
│   │       └── loading-screen/
│   └── store/                   # ניהול מצב
│       └── app.store.ts         # SignalStore
├── styles.scss                  # סגנונות גלובליים
└── index.html                   # HTML ראשי (RTL)
```

### טכנולוגיות

- **Angular 19** - פריימוורק
- **@ngrx/signals** - ניהול מצב עם SignalStore
- **Tailwind CSS** - עיצוב
- **Standalone Components** - ארכיטקטורה

## 🎨 עיצוב

- **RTL** - תמיכה מלאה בעברית
- **Dark Mode** - מצב כהה מובנה
- **Glassmorphism** - אפקט זכוכית מודרני
- **Neural Theme** - פלטת צבעים עתידנית

## 🧪 שאלות לדוגמה

האפליקציה מזהה שאלות בעברית על עובדים:

- "כמה ימי חופש נשארו לדני?"
- "מה המשכורת של שרה לוי?"
- "באיזה מחלקה עובד יוסי?"
- "מתי התחילה מיכל לעבוד?"
- "מי המנהל של נועה?"

## 📋 תכונות

✅ אימות משתמש (Mock)
✅ טעינת נתוני עובדים מורשים
✅ חיפוש Fuzzy בעברית
✅ עיבוד שאלות בשפה טבעית
✅ תשובות מבוססות AI (Mock)
✅ ממשק צ'אט מודרני
✅ סרגל צד עובדים
✅ אנימציות טעינה

## 🔒 אבטחה

- המשתמש רואה רק עובדים מורשים
- כל השאילתות מאומתות
- נתונים רגישים מוגנים

## 📄 רישיון

MIT
