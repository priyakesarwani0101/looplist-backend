import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import {
  Loop,
  LoopVisibility,
  LoopState,
  LoopFrequency,
} from '../loops/entities/loop.entity';
import { Streak, StreakStatus } from '../loops/entities/streak.entity';
import { Reaction } from '../reactions/entities/reaction.entity';
import * as bcrypt from 'bcrypt';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'looplist',
  entities: [User, Loop, Streak, Reaction],
  synchronize: true,
});

async function seed() {
  try {
    await dataSource.initialize();
    console.log('Data Source has been initialized!');

    // Clear existing data
    await dataSource.getRepository(Reaction).delete({});
    await dataSource.getRepository(Streak).delete({});
    await dataSource.getRepository(Loop).delete({});
    await dataSource.getRepository(User).delete({});
    console.log('Existing data cleared!');

    // Create users
    const users = await createUsers();
    console.log('Users created:', users.length);

    // Create loops for each user
    const loops = await createLoops(users);
    console.log('Loops created:', loops.length);

    // Create streaks for loops
    const streaks = await createStreaks(loops);
    console.log('Streaks created:', streaks.length);

    // Create reactions for loops
    const reactions = await createReactions(loops, users);
    console.log('Reactions created:', reactions.length);

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await dataSource.destroy();
  }
}

async function createUsers() {
  const userRepository = dataSource.getRepository(User);
  const users = [
    {
      email: 'john@example.com',
      password: await bcrypt.hash('password123', 10),
      username: 'john_doe',
      name: 'John Doe',
    },
    {
      email: 'jane@example.com',
      password: await bcrypt.hash('password123', 10),
      username: 'jane_smith',
      name: 'Jane Smith',
    },
    {
      email: 'alex@example.com',
      password: await bcrypt.hash('password123', 10),
      username: 'alex_wong',
      name: 'Alex Wong',
    },
    {
      email: 'sarah@example.com',
      password: await bcrypt.hash('password123', 10),
      username: 'sarah_jones',
      name: 'Sarah Jones',
    },
  ];

  return userRepository.save(users);
}

async function createLoops(users: User[]) {
  const loopRepository = dataSource.getRepository(Loop);
  const loops = [];

  const loopTemplates = [
    {
      title: 'Daily Meditation',
      frequency: LoopFrequency.DAILY,
      visibility: LoopVisibility.PUBLIC,
      emoji: '🧘',
    },
    {
      title: 'Morning Run',
      frequency: LoopFrequency.DAILY,
      visibility: LoopVisibility.PUBLIC,
      emoji: '🏃',
    },
    {
      title: 'Read Books',
      frequency: LoopFrequency.DAILY,
      visibility: LoopVisibility.PUBLIC,
      emoji: '📚',
    },
    {
      title: 'Learn Spanish',
      frequency: LoopFrequency.DAILY,
      visibility: LoopVisibility.PUBLIC,
      emoji: '🇪🇸',
    },
    {
      title: 'Personal Journal',
      frequency: LoopFrequency.DAILY,
      visibility: LoopVisibility.PRIVATE,
      emoji: '📝',
    },
    {
      title: 'Gym Workout',
      frequency: LoopFrequency.THREE_TIMES_WEEK,
      visibility: LoopVisibility.PUBLIC,
      emoji: '💪',
    },
    {
      title: 'Family Time',
      frequency: LoopFrequency.WEEKDAYS,
      visibility: LoopVisibility.PRIVATE,
      emoji: '👨‍👦',
    },
  ];

  for (const user of users) {
    for (const template of loopTemplates) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 365); // Start 1 year ago

      const loop = loopRepository.create({
        ...template,
        user: { id: user.id },
        startDate,
        state: LoopState.ACTIVE,
        currentStreak: 0,
        longestStreak: 0,
        completionRate: 0,
        totalCompletions: 0,
        totalDays: 0,
        cloneCount: 0,
      });

      loops.push(loop);
    }
  }

  return loopRepository.save(loops);
}

async function createStreaks(loops: Loop[]) {
  const streakRepository = dataSource.getRepository(Streak);
  const streaks = [];

  for (const loop of loops) {
    const startDate = new Date(loop.startDate);
    const today = new Date();

    // Calculate streak data
    let currentStreak = 0;
    let longestStreak = 0;
    let totalCompletions = 0;
    let totalDays = 0;
    let tempStreak = 0;

    // Create streaks for the past year
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      totalDays++;

      // Skip some days randomly to make it more realistic
      // Higher chance of completion for daily habits
      const completionChance =
        loop.frequency === LoopFrequency.DAILY ? 0.8 : 0.6;
      const shouldComplete = Math.random() < completionChance;

      if (shouldComplete) {
        totalCompletions++;
        tempStreak++;
        currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }

      const status = shouldComplete
        ? StreakStatus.COMPLETED
        : StreakStatus.SKIPPED;

      const streak = streakRepository.create({
        date: new Date(d),
        status,
        loop: { id: loop.id },
      });

      streaks.push(streak);
    }

    // Update loop with streak statistics
    await dataSource.getRepository(Loop).update(loop.id, {
      currentStreak,
      longestStreak,
      totalCompletions,
      totalDays,
      completionRate: totalDays > 0 ? (totalCompletions / totalDays) * 100 : 0,
    });
  }

  return streakRepository.save(streaks);
}

async function createReactions(loops: Loop[], users: User[]) {
  const reactionRepository = dataSource.getRepository(Reaction);
  const reactions = [];

  const emojis = ['👍', '❤️', '🔥', '👏', '💪', '🎉', '🙌'];

  for (const loop of loops) {
    // Only add reactions to public loops
    if (loop.visibility !== LoopVisibility.PUBLIC) continue;

    // Each public loop gets 3-7 reactions from different users
    const numReactions = Math.floor(Math.random() * 5) + 3;
    const reactingUsers = [...users]
      .sort(() => 0.5 - Math.random())
      .slice(0, numReactions);

    for (const user of reactingUsers) {
      const reaction = reactionRepository.create({
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        user: { id: user.id },
        loop: { id: loop.id },
      });

      reactions.push(reaction);
    }
  }

  return reactionRepository.save(reactions);
}

seed();
