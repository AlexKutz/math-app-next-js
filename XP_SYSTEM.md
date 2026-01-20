# Система опыта (XP) и интервальных повторений (SRS)

Этот документ описывает, как на сайте работает вся система опыта:
- как считается XP за задачу;
- как работает Anti-Grind (ежедневная «энергия» темы);
- как устроены уровни (с уровнем 0);
- как работает интервальное повторение (SRS);
- какие данные хранятся в базе и как всё это связывается в пользовательский сценарий.

---

## 1. Объекты системы и данные в БД

### 1.1. Конфигурация темы: `TopicXpConfig`

Таблица: `topic_xp_config`  
Тип в коде: [`TopicXPConfig`](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/types/xp.ts#L26-L48)  
Маппинг: [`mapTopicConfigRow`](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/lib/xp/xpService.ts#L12-L43)

Главные поля:
- `baseTaskXp` — базовый XP за одну задачу (обычно 100).
- `dailyFullTasks` — сколько задач в теме за день дают полный XP (обычно 10).
- `dailyHalfTasks` — сколько следующих задач в теме дают половинный XP (обычно 10).
- `multiplierFull` — множитель для первых задач (обычно 1.0 → 100% XP).
- `multiplierHalf` — множитель для «уставших» задач (обычно 0.5 → 50% XP).
- `multiplierLow` — множитель для сильно уставших задач (обычно 0.1 → 10% XP).
- `multiplierEarly` — множитель при «слишком раннем» повторении (обычно 0.1).
- `levelThresholds` — пороги XP для уровней (по умолчанию `[1000, 2500, 4500, 7000, 10000]`).
- `reviewIntervals` — интервалы SRS в днях (по умолчанию `[1, 3, 7, 14, 30]`).
- `dailyXpDecay`, `minXpPercent` — параметры старой формулы SRS (используются в `calculateXP`, но не в основной новой точке входа).

По сути `TopicXpConfig` — это «настройка режима сложности» для темы:
- сколько задач в день выгодно решать,
- какие дни считаются правильными для повторения,
- сколько XP нужно для перехода между уровнями.

### 1.2. Прогресс по теме: `UserTopicXp`

Таблица: `user_topic_xp`  
Тип в коде: [`UserTopicXP`](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/types/xp.ts#L50-L68)  
Схема: [`UserTopicXp` в Prisma](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/prisma/schema.prisma#L73-L101)  
Маппинг: [`mapUserTopicXPRow`](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/lib/xp/xpService.ts#L46-L61)

Главные поля:
- `currentXp` — текущий XP по теме (используется для уровня).
- `totalXpEarned` — суммарный XP по теме (для статистики).
- `level` — текущий уровень **от 0 до 5**.
- `dailyTasksCount` — сколько задач по теме решено сегодня (для Anti-Grind).
- `dailyTasksDate` — на какую дату относится `dailyTasksCount`.
- `srsStage` — номер стадии SRS (сколько «правильных» повторений уже было).
- `nextReviewDate` — дата, когда тема снова станет «горячей».
- `lastPracticedDate` — последняя дата практики.
- `createdAt`, `lastActivity` — системные даты.

Дополнительно в объекте, возвращаемом из сервиса, вычисляются:
- `currentLevelMinXp` — нижняя граница XP для текущего уровня;
- `nextLevelXp` — порог XP следующего уровня.

### 1.3. История попыток: `UserTaskAttempt`

Таблица: `user_task_attempts`  
Тип в коде: [`UserTaskAttempt`](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/types/xp.ts#L70-L81)  
Маппинг: [`mapUserTaskAttemptRow`](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/lib/xp/xpService.ts#L278-L291)

Главные поля:
- `taskId`, `topicSlug` — какая задача и по какой теме.
- `xpEarned` — сколько XP дали за эту попытку.
- `isCorrect` — правильно ли решена задача.
- `nextReviewDate` — когда эту задачу стоит повторить.
- `reviewCount` — сколько раз задача уже повторялась.
- `masteryLevel` — уровень освоения **конкретной задачи** (отдельно от уровня темы).

История нужна для:
- выборки задач, которые «должны быть повторены»;
- аналитики (сколько попыток, средний mastery и т.п.).

---

## 2. Уровни и пороги XP (с уровнем 0)

Расчёт уровня реализован в методе  
[`computeLevelFromThresholds`](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/lib/xp/xpService.ts#L71-L88).

### 2.1. Пороговая модель уровней

Конфигурация по умолчанию:
- `levelThresholds = [1000, 2500, 4500, 7000, 10000]`.

Интерпретация:
- Уровень 0: `XP < 1000`;
- Уровень 1: `XP ≥ 1000`;
- Уровень 2: `XP ≥ 2500`;
- Уровень 3: `XP ≥ 4500`;
- Уровень 4: `XP ≥ 7000`;
- Уровень 5: `XP ≥ 10000`.

Алгоритм:
1. Берём отсортированный массив порогов.
2. Считаем, сколько порогов уже пройдено:
   - `achieved` = количество порогов, для которых `currentXp >= threshold`.
3. Вычисляем уровень:
   - `level = clamp(achieved, 0, 5)` — в диапазоне от 0 до 5.
4. Дополнительно считаем:
   - `currentLevelMinXp`:
     - если `level = 0` → `0`;
     - иначе `thresholds[level - 1]`.
   - `nextLevelXp`:
     - `thresholds[level]`, если он есть;
     - `null`, если уровень максимальный.

Таким образом:
- новый пользователь всегда стартует с **уровня 0**;
- при наборе 1000 XP по теме он поднимается на уровень 1 и т.д.

### 2.2. Синхронизация уровня в БД

Уровень хранится:
- в `UserTopicXp.level` (поле в базе);
- в истории попыток в `UserTaskAttempt.masteryLevel` (по задачам).

Обновление уровня по теме:
- при основной точке входа `submitCorrectTask`:
  - уровень считается через `computeLevelFromThresholds` и кладётся в `user_topic_xp.level`;
- в запасном пути `saveTaskAttempt`:
  - ранее уровень считался грубо по формуле `Math.floor(newCurrentXp / 100) + 1`;
  - теперь этот путь тоже использует `computeLevelFromThresholds`, чтобы пороги уровней везде совпадали.

---

## 3. Anti-Grind: ежедневная «энергия» темы

Anti-Grind реализован через:
- счётчик задач за день по теме (`dailyTasksCount` и `dailyTasksDate`);
- множители XP в `TopicXpConfig`;
- функцию [`computeDailyMultiplier`](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/lib/xp/xpService.ts#L90-L105);
- основную транзакцию [`submitCorrectTask`](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/lib/xp/xpService.ts#L117-L235).

### 3.1. Счётчик задач по теме за день

При каждом правильном решении задачи вызывается `XPService.submitCorrectTask`:
1. Загружается прогресс по теме из `user_topic_xp`.
2. Вычисляется текущая дата в формате `YYYY-MM-DD`.
3. Если `dailyTasksDate` не совпадает с сегодняшней датой:
   - `isNewDay = true`;
   - `dailyTasksCountBefore = 0`;
   - при обновлении прогресса `dailyTasksCount` будет увеличен с 0 до 1.
4. Если дата совпадает:
   - `dailyTasksCountBefore = progress.dailyTasksCount`.

Важно:
- Счётчик идёт **по теме**: каждая тема имеет свою собственную «энергию».
- Счётчик **не сбрасывается** только из-за того, что тема «горячая» (пришло время повторения) — это было исправлено, чтобы Anti-Grind реально ограничивал фарм.

### 3.2. Множители XP по номеру задачи за день

Функция [`computeDailyMultiplier`](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/lib/xp/xpService.ts#L90-L105) работает так:

Пусть:
- `idx = dailyTasksCountBefore + 1` — номер текущей задачи по теме сегодня;
- `fullEnd = dailyFullTasks`;
- `halfEnd = dailyFullTasks + dailyHalfTasks`.

Тогда:
- если `idx ≤ fullEnd`:
  - множитель = `multiplierFull` (обычно 1.0 → 100% XP);
- иначе если `idx ≤ halfEnd`:
  - множитель = `multiplierHalf` (обычно 0.5 → 50% XP);
- иначе:
  - множитель = `multiplierLow` (обычно 0.1 → 10% XP).

Это реализует схему:
- первые 10 задач по теме: 100% XP;
- задачи 11–20: 50% XP;
- 21+ задач: 10% XP.

### 3.3. Учет слишком раннего повторения (isTooEarly)

Внутри `submitCorrectTask` вычисляются флаги:
- `nextReviewISO` — строковое представление `nextReviewDate`;
- `todayISO` — сегодняшняя дата;
- `isHotTopic` — тема «горячая», если `nextReviewDate` не задана или уже наступила;
- `isTooEarly` — повторение слишком рано, если `nextReviewDate` позже сегодняшнего дня.

Множитель XP:
- если `isTooEarly = true`:
  - множитель = `multiplierEarly` (обычно 0.1 → 10% от базы);
  - Anti-Grind по номеру задачи при этом не используется;
- если `isTooEarly = false`:
  - используется `computeDailyMultiplier` и стандартная лестница усталости.

Таким образом:
- «правильное» повторение в нужный день получает максимум XP, но с учётом усталости;
- «слишком раннее» повторение получает сильно урезанный XP, независимо от номера задачи за сегодня.

---

## 4. Интервальное повторение (SRS)

SRS-интервалы и стадия освоения темы управляются в `submitCorrectTask`:
- поля: `srsStage`, `nextReviewDate` в `UserTopicXp`;
- конфиг: `reviewIntervals` в `TopicXpConfig`.

### 4.1. Логика стадий SRS

Переменные:
- `stageBefore = progress.srsStage ?? 0` — текущая стадия;
- `intervals = config.reviewIntervals` или `[1, 3, 7, 14, 30]` по умолчанию.

Обновление стадии:
- если повторение «слишком раннее» (`isTooEarly = true`):
  - `stageAfter = stageBefore` — стадия не растёт;
- если повторение в срок (`isTooEarly = false`):
  - `stageAfter = stageBefore + 1`.

Обновление `nextReviewDate`:
- если `isTooEarly = true`:
  - `nextReviewDate` не меняется (берётся текущая из прогресса);
- если `isTooEarly = false`:
  - берём интервал по индексу `stageAfter - 1` (0-базовый массив):
    - стадия 1 → `intervals[0]` (обычно 1 день);
    - стадия 2 → `intervals[1]` (обычно 3 дня);
    - стадия 3 → `intervals[2]` (обычно 7 дней);
    - и так далее;
  - если `stageAfter - 1` выходит за пределы массива, `nextReviewDate` = `null` — тема считается полностью усвоенной с точки зрения SRS.

### 4.2. Флаги isHotTopic / isTooEarly

Для UI и сообщений считаются флаги:
- `isHotTopic = !nextReviewISO || nextReviewISO <= todayISO`:
  - тема ещё ни разу не повторялась (`nextReviewDate` = null);
  - или дата повторения уже наступила.
- `isTooEarly = !!nextReviewISO && nextReviewISO > todayISO`:
  - тема «остыла» слишком рано, пришли до нужной даты.

Эти флаги используются:
- в анти‑грайнд логике (выбор множителя);
- в сообщениях для пользователя;
- в UI (золотая подсветка «горячей» темы, отображение таймера до следующего повторения).

---

## 5. Основной поток начисления XP: submitCorrectTask

Главная точка входа:  
[`XPService.submitCorrectTask`](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/lib/xp/xpService.ts#L117-L275)

Вызывается из API:  
[`app/api/tasks/submit/route.ts`](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/app/api/tasks/submit/route.ts#L1-L56)  
и с фронта:  
[`components/tasks/Tasks.tsx`](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/components/tasks/Tasks.tsx#L61-L114)

Пошагово:
1. На фронте пользователь решает задачу.
2. Если ответ правильный, `/api/tasks/submit` вызывает `XPService.submitCorrectTask`.
3. Внутри `submitCorrectTask`:
   - загружается `TopicXpConfig`;
   - загружается или создаётся `UserTopicXp`;
   - определяется, новый день или нет;
   - вычисляются `isHotTopic`, `isTooEarly`;
   - выбирается множитель XP (Anti-Grind + SRS);
   - рассчитывается `xpEarned`;
   - обновляется SRS (`srsStage`, `nextReviewDate`);
   - обновляется XP и уровень темы (`currentXp`, `totalXpEarned`, `level`);
   - формируется сообщение пользователю;
   - создаётся запись в `UserTaskAttempt`;
   - обновляется строка `user_topic_xp`.
4. Результат (`xpResult` и `userXP`) возвращается в API и дальше на фронт.
5. Фронт обновляет:
   - виджет прогресса по теме (уровень, XP, прогресс‑бар);
   - всплывающее сообщение о полученном опыте, множителе, следующем повторении и т.д.

---

## 6. Альтернативная точка входа: calculateXP + saveTaskAttempt

Исторически в системе есть более старая модель:
- [`calculateXP`](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/lib/xp/xpService.ts#L356-L452) — считает XP и SRS без Anti-Grind;
- [`saveTaskAttempt`](file:///c:/Users/alex/Desktop/personal-site-next/math-app-next-js/lib/xp/xpService.ts#L500-L564) — сохраняет результат попытки и обновляет прогресс.

Особенности `calculateXP`:
- учитывает `dailyXpDecay` и `minXpPercent`;
- повышает `masteryLevel` задачи при запланированном повторении;
- не учитывает `dailyTasksCount` и множители усталости.

Сейчас основная, «правильная» интеграция для боевого сценария — это `submitCorrectTask`, потому что:
- в нём объединены:
  - SRS,
  - Anti-Grind,
  - уровни и прогресс по теме;
- в нём есть вся необходимая диагностическая информация для UI.

`calculateXP` и `saveTaskAttempt` можно рассматривать как более низкоуровневый или устаревший путь, который пригодится, если нужно отдельно считать XP по историческим данным без участия `user_topic_xp`.

---

## 7. Сценарий пользователя в терминах реализации

Рассмотрим упрощённый сценарий:

### День 0 (изучение)

1. Пользователь открывает новую тему:
   - в `user_topic_xp` создаётся запись с:
     - `currentXp = 0`, `level = 0`;
     - `srsStage = 0`, `nextReviewDate = null`.
2. Пользователь решает 10 задач по теме:
   - каждая задача:
     - Anti-Grind: `idx` от 1 до 10 → `multiplierFull = 1.0`;
     - `xpEarned = baseTaskXp * 1.0` (обычно 100 XP);
   - суммарно: 1000 XP.
3. После 10-й задачи:
   - `currentXp` ≈ 1000 → уровень становится 1;
   - `srsStage` = 1;
   - `nextReviewDate` = `today + reviewIntervals[0]` (обычно завтра).

### День 1 (слишком рано, если конфиг настроен иначе)

Если конфигурация `reviewIntervals` начинается с `1`, то следующая дата ровно через один день. Если хочется сценарий, где «день 2 — слишком рано», можно задать интервалы `[2, 3, 7, 14, ...]`. Тогда:

- при приходе на день 1:
  - `isTooEarly = true`;
  - множитель XP = `multiplierEarly` (например 0.1 → 10 XP);
  - `srsStage` и `nextReviewDate` не меняются.

### День, когда наступает `nextReviewDate` (горячая тема)

1. Пользователь заходит в тему:
   - `isHotTopic = true`, `isTooEarly = false`;
   - UI может подсветить тему как «горячую».
2. Решает 10 задач:
   - снова получает полный XP за первые `dailyFullTasks` задач;
   - `srsStage` увеличивается на 1;
   - `nextReviewDate` сдвигается на следующий интервал (`3 дня`, потом `7`, `14` и т.д.).

Таким образом:
- система не даёт эффективно фармить одну тему весь день, благодаря Anti-Grind;
- система подталкивает к возвращению в тему в нужные дни, благодаря SRS;
- уровень темы растёт ступенчато, а старт всегда начинается с уровня 0.

---

## 8. Что можно доработать поверх этой логики

Текущая реализация даёт полный фундамент:
- XP + усталость по теме;
- уровни 0–5 с порогами;
- SRS-интервалы с «горячими» днями и «слишком ранним» повторением;
- хранение прогресса и истории.

Сверху можно добавить:
- визуализацию «энергии темы» (батарейка, сколько задач ещё с полным XP);
- таймер до `nextReviewDate` в UI;
- бейджи за идеальный ритм (если пользователь приходит ровно в «горячие» дни);
- более гибкие конфиги `reviewIntervals` и `levelThresholds` под разные темы.

