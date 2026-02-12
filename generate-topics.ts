import fs from 'fs';
import path from 'path';
import readline from 'readline';

interface Lesson {
  title: string;
  folder: string;
}

interface Section {
  title: string;
  description: string;
  lessons: Lesson[];
}

interface AllTopics {
  pageTitle: string;
  pageDescription: string;
  sections: Section[];
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function generateConfigJson(lesson: Lesson): string {
  return JSON.stringify({
    slug: lesson.folder,
    title: lesson.title,
    description: lesson.title,
    difficulty: "easy",
    category: "math",
    "list-position": 1,
    tags: ["математика", "основи"]
  }, null, 2);
}

function generateIndexMdx(lesson: Lesson): string {
  return `---
title: '${lesson.title}'
description: '${lesson.title}'
difficulty: 'easy'
math: true
---

# ${lesson.title}

Це початковий вміст уроку. Додайте сюди теорію, приклади та пояснення.

## Основні поняття

Напишіть основні поняття та визначення.

## Приклади

Додайте приклади з поясненнями.

$$
\\text{Формула для прикладу}
$$

## Висновок

Підсумуйте ключові моменти уроку.
`;
}

function generateInitialTask(): string {
  return JSON.stringify([
    {
      id: `${Date.now()}-001`,
      type: "multiple-choice",
      question: "Початкове питання для цієї теми",
      difficulty: "easy",
      baseXP: 1000,
      options: [
        { text: "Відповідь 1", comment: null },
        { text: "Відповідь 2", comment: "Поясніть, чому це неправильно" },
        { text: "Відповідь 3", comment: "Поясніть, чому це неправильно" },
        { text: "Відповідь 4", comment: "Поясніть, чому це неправильно" }
      ],
      answer: 0
    }
  ], null, 2);
}

async function createTopicFolder(contentDir: string, lesson: Lesson): Promise<void> {
  const folderPath = path.join(contentDir, lesson.folder);
  
  // Create main folder
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`✅ Створено папку: ${lesson.folder}`);
  } else {
    console.log(`⚠️  Папка вже існує: ${lesson.folder}`);
  }

  // Create config.json
  const configPath = path.join(folderPath, 'config.json');
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, generateConfigJson(lesson));
    console.log(`   ├─ Створено config.json`);
  } else {
    console.log(`   ├─ config.json вже існує`);
  }

  // Create index.mdx
  const indexPath = path.join(folderPath, 'index.mdx');
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, generateIndexMdx(lesson));
    console.log(`   ├─ Створено index.mdx`);
  } else {
    console.log(`   ├─ index.mdx вже існує`);
  }

  // Create tasks folder
  const tasksPath = path.join(folderPath, 'tasks');
  if (!fs.existsSync(tasksPath)) {
    fs.mkdirSync(tasksPath);
    console.log(`   └─ Створено папку tasks/`);
  } else {
    console.log(`   └─ Папка tasks/ вже існує`);
  }

  // Create initial task
  const taskPath = path.join(tasksPath, '001-mcq.json');
  if (!fs.existsSync(taskPath)) {
    fs.writeFileSync(taskPath, generateInitialTask());
    console.log(`      └─ Створено 001-mcq.json`);
  } else {
    console.log(`      └─ 001-mcq.json вже існує`);
  }
}

async function findOrphanedFolders(contentDir: string, validFolders: Set<string>): Promise<string[]> {
  const allFolders = fs.readdirSync(contentDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => name !== 'tasks' && !name.startsWith('.'));

  const orphaned = allFolders.filter(folder => 
    !validFolders.has(folder) && folder !== 'allTopics.json'
  );

  return orphaned;
}

async function handleOrphanedFolders(contentDir: string, orphaned: string[]): Promise<void> {
  if (orphaned.length === 0) {
    console.log('\n✅ Немає папок для видалення. Всі папки відповідають allTopics.json');
    return;
  }

  console.log('\n⚠️  Знайдено папки, які не існують в allTopics.json:');
  orphaned.forEach((folder, index) => {
    console.log(`   ${index + 1}. ${folder}`);
  });

  console.log('\nЩо зробити з цими папками?');
  console.log('1. Тільки відобразити (нічого не видаляти)');
  console.log('2. Видалити всі');
  console.log('3. Вибрати які видаляти');
  console.log('4. Скасувати');

  const choice = await question('\nВведіть номер варіанту (1-4): ');

  switch (choice.trim()) {
    case '1':
      console.log('\n📋 Список показано вище. Нічого не видалено.');
      break;

    case '2':
      console.log('\n🗑️  Підтвердження видалення ВСІХ папок:');
      orphaned.forEach(folder => console.log(`   - ${folder}`));
      const confirmAll = await question('\nВи впевнені? (y/n): ');
      if (confirmAll.toLowerCase() === 'y') {
        for (const folder of orphaned) {
          const folderPath = path.join(contentDir, folder);
          fs.rmSync(folderPath, { recursive: true, force: true });
          console.log(`   ✅ Видалено: ${folder}`);
        }
        console.log('\n✅ Всі папки успішно видалено');
      } else {
        console.log('❌ Видалення скасовано');
      }
      break;

    case '3':
      console.log('\nВведіть номери папок для видалення (через кому, наприклад: 1,3,5):');
      const selection = await question('Номери: ');
      const indices = selection.split(',')
        .map(s => parseInt(s.trim()) - 1)
        .filter(i => i >= 0 && i < orphaned.length);

      if (indices.length === 0) {
        console.log('❌ Невірний вибір');
        break;
      }

      const selectedFolders = indices.map(i => orphaned[i]);
      console.log('\n🗑️  Будуть видалені наступні папки:');
      selectedFolders.forEach(folder => console.log(`   - ${folder}`));

      const confirmSelected = await question('\nПідтвердити видалення? (y/n): ');
      if (confirmSelected.toLowerCase() === 'y') {
        for (const folder of selectedFolders) {
          const folderPath = path.join(contentDir, folder);
          fs.rmSync(folderPath, { recursive: true, force: true });
          console.log(`   ✅ Видалено: ${folder}`);
        }
        console.log('\n✅ Вибрані папки успішно видалено');
      } else {
        console.log('❌ Видалення скасовано');
      }
      break;

    case '4':
      console.log('❌ Операцію скасовано');
      break;

    default:
      console.log('❌ Невірний вибір');
  }
}

async function processSubject(subject: string): Promise<void> {
  const contentDir = path.join(process.cwd(), 'content', subject);
  const allTopicsPath = path.join(contentDir, 'allTopics.json');

  console.log(`\n📂 Обробка предмету: ${subject.toUpperCase()}`);
  console.log('━'.repeat(50));

  // Check if allTopics.json exists
  if (!fs.existsSync(allTopicsPath)) {
    console.error(`❌ Файл не знайдено: ${allTopicsPath}`);
    return;
  }

  // Read allTopics.json
  const allTopicsContent = fs.readFileSync(allTopicsPath, 'utf-8');
  const allTopics: AllTopics = JSON.parse(allTopicsContent);

  // Collect all valid folder names
  const validFolders = new Set<string>();
  let totalLessons = 0;

  console.log('📚 Створення папок для тем...\n');

  // Create folders for each lesson
  for (const section of allTopics.sections) {
    if (section.lessons.length === 0) {
      console.log(`\n📖 Розділ: ${section.title} (порожній)`);
      continue;
    }
    console.log(`\n📖 Розділ: ${section.title}`);
    for (const lesson of section.lessons) {
      validFolders.add(lesson.folder);
      totalLessons++;
      await createTopicFolder(contentDir, lesson);
    }
  }

  if (totalLessons === 0) {
    console.log('\n⚠️  Немає тем для створення в цьому предметі');
  } else {
    console.log(`\n✅ Опрацьовано ${totalLessons} тем з ${allTopics.sections.length} розділів`);
  }

  // Check for orphaned folders
  const orphaned = await findOrphanedFolders(contentDir, validFolders);
  await handleOrphanedFolders(contentDir, orphaned);
}

async function selectSubject(): Promise<string[]> {
  const subjects = ['math', 'algebra', 'geometry', 'physics'];
  
  console.log('📚 Оберіть предмет для генерації тем:\n');
  subjects.forEach((subject, index) => {
    console.log(`   ${index + 1}. ${subject}`);
  });
  console.log(`   ${subjects.length + 1}. all (всі предмети)`);
  console.log('   0. Скасувати\n');

  const choice = await question('Введіть номер варіанту: ');
  const choiceNum = parseInt(choice.trim());

  if (choiceNum === 0) {
    console.log('❌ Операцію скасовано');
    return [];
  }

  if (choiceNum > 0 && choiceNum <= subjects.length) {
    return [subjects[choiceNum - 1]];
  }

  if (choiceNum === subjects.length + 1) {
    return subjects;
  }

  console.log('❌ Невірний вибір');
  return [];
}

async function main() {
  console.log('🚀 Генератор структури тем для math-app\n');
  console.log('━'.repeat(50));

  const selectedSubjects = await selectSubject();

  if (selectedSubjects.length === 0) {
    rl.close();
    process.exit(0);
  }

  for (const subject of selectedSubjects) {
    await processSubject(subject);
  }

  rl.close();
  console.log('\n🎉 Готово!');
}

main().catch((error) => {
  console.error('❌ Помилка:', error);
  rl.close();
  process.exit(1);
});
