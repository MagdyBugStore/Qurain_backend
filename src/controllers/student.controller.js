import { Session, Student } from '../models/index.js';

/**
 * Get student tasks
 */
export const getStudentTasks = async (req, res, next) => {
  try {
    const { status, limit } = req.query;
    const student = await Student.findOne({ userId: req.user.id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Student profile not found' },
        meta: {},
      });
    }

    let tasks = student.tasks || [];
    
    // Filter by status if provided
    if (status) {
      tasks = tasks.filter(task => task.status === status);
    }
    
    // Sort by dueDate and limit
    tasks = tasks
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, parseInt(limit) || 100);

    res.json({
      success: true,
      data: { tasks },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get weekly tasks
 */
export const getWeeklyTasks = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Student profile not found' },
        meta: {},
      });
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const tasks = (student.tasks || [])
      .filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= weekStart && dueDate <= weekEnd;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.json({
      success: true,
      data: { tasks },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create task
 */
export const createTask = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority } = req.body;
    const student = await Student.findOne({ userId: req.user.id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Student profile not found' },
        meta: {},
      });
    }

    const newTask = {
      title,
      description,
      dueDate: new Date(dueDate),
      priority: priority || 'medium',
      status: 'pending',
    };
    
    student.tasks = student.tasks || [];
    student.tasks.push(newTask);
    await student.save();

    // Get the newly added task (last item in array)
    const savedTask = student.tasks[student.tasks.length - 1];

    res.status(201).json({
      success: true,
      data: { task: savedTask },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update task status
 */
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Student profile not found' },
        meta: {},
      });
    }

    // Find task in embedded array by _id
    const tasks = student.tasks || [];
    const taskIndex = tasks.findIndex(
      task => task._id && task._id.toString() === taskId
    );

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TASK_NOT_FOUND', message: 'Task not found' },
        meta: {},
      });
    }

    // Update the task
    tasks[taskIndex].status = status;
    if (status === 'completed') {
      tasks[taskIndex].completedAt = new Date();
    }
    student.tasks = tasks;
    await student.save();

    res.json({
      success: true,
      data: { task: tasks[taskIndex] },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get upcoming session
 */
export const getUpcomingSession = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Student profile not found' },
        meta: {},
      });
    }

    const now = new Date();
    const session = await Session.findOne({
      studentId: student._id,
      status: 'scheduled',
      scheduledStart: { $gte: now },
    })
      .populate('teacherId', 'userId')
      .populate({ path: 'teacherId', populate: { path: 'userId' } })
      .sort({ scheduledStart: 1 })
      .lean();

    res.json({
      success: true,
      data: { session: session || null },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student sessions
 */
export const getStudentSessions = async (req, res, next) => {
  try {
    const { status, limit } = req.query;
    const student = await Student.findOne({ userId: req.user.id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Student profile not found' },
        meta: {},
      });
    }

    const query = { studentId: student._id };
    if (status) query.status = status;

    const sessions = await Session.find(query)
      .populate('teacherId', 'userId')
      .populate({ path: 'teacherId', populate: { path: 'userId' } })
      .sort({ scheduledStart: -1 })
      .limit(parseInt(limit) || 100)
      .lean();

    res.json({
      success: true,
      data: { sessions },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get memorization logs
 */
export const getMemorizationLogs = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const student = await Student.findOne({ userId: req.user.id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Student profile not found' },
        meta: {},
      });
    }

    let logs = student.memorizationLogs || [];
    
    // Sort by loggedDate and limit
    logs = logs
      .sort((a, b) => new Date(b.loggedDate) - new Date(a.loggedDate))
      .slice(0, parseInt(limit) || 100);

    res.json({
      success: true,
      data: { logs },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create memorization log
 */
export const createMemorizationLog = async (req, res, next) => {
  try {
    const { juz, surah, verses, notes, loggedDate } = req.body;
    const student = await Student.findOne({ userId: req.user.id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Student profile not found' },
        meta: {},
      });
    }

    const newLog = {
      juz,
      surah,
      verses,
      notes,
      loggedDate: loggedDate ? new Date(loggedDate) : new Date(),
    };
    
    student.memorizationLogs = student.memorizationLogs || [];
    student.memorizationLogs.push(newLog);
    await student.save();

    // Get the newly added log (last item in array)
    const savedLog = student.memorizationLogs[student.memorizationLogs.length - 1];

    res.status(201).json({
      success: true,
      data: { log: savedLog },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student activities
 */
export const getStudentActivities = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const student = await Student.findOne({ userId: req.user.id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Student profile not found' },
        meta: {},
      });
    }

    let activities = student.activities || [];
    
    // Sort by createdAt and limit
    activities = activities
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, parseInt(limit) || 10);

    res.json({
      success: true,
      data: { activities },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create activity
 */
export const createActivity = async (req, res, next) => {
  try {
    const { type, title, description, metadata } = req.body;
    const student = await Student.findOne({ userId: req.user.id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Student profile not found' },
        meta: {},
      });
    }

    const newActivity = {
      type,
      title,
      description,
      metadata,
    };
    
    student.activities = student.activities || [];
    student.activities.push(newActivity);
    await student.save();

    // Get the newly added activity (last item in array)
    const savedActivity = student.activities[student.activities.length - 1];

    res.status(201).json({
      success: true,
      data: { activity: savedActivity },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student stats
 */
export const getStudentStats = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Student profile not found' },
        meta: {},
      });
    }

    const allSessions = await Session.find({ studentId: student._id }).lean();
    const allTasks = student.tasks || [];
    const logs = student.memorizationLogs || [];

    const completedSessions = allSessions.filter(s => s.status === 'completed');
    const upcomingSessions = allSessions.filter(s => s.status === 'scheduled');
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const pendingTasks = allTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    const memorizedParts = new Set(logs.map(log => log.juz).filter(Boolean)).size;

    res.json({
      success: true,
      data: {
        stats: {
          totalSessions: allSessions.length,
          completedSessions: completedSessions.length,
          upcomingSessions: upcomingSessions.length,
          memorizedParts,
          completedTasks: completedTasks.length,
          pendingTasks: pendingTasks.length,
        },
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};
