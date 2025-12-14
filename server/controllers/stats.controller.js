const Ticket = require('../models/Ticket');
const Agent = require('../models/Agent');

// Get queue statistics
exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get counts by status
    const [
      totalToday,
      waiting,
      serving,
      completed,
      cancelled,
      noShow
    ] = await Promise.all([
      Ticket.countDocuments({ createdAt: { $gte: today } }),
      Ticket.countDocuments({ status: 'waiting' }),
      Ticket.countDocuments({ status: 'serving' }),
      Ticket.countDocuments({ status: 'completed', createdAt: { $gte: today } }),
      Ticket.countDocuments({ status: 'cancelled', createdAt: { $gte: today } }),
      Ticket.countDocuments({ status: 'no-show', createdAt: { $gte: today } })
    ]);

    // Calculate average wait time for completed tickets today
    const completedTickets = await Ticket.find({
      status: 'completed',
      createdAt: { $gte: today },
      calledAt: { $ne: null }
    });

    let avgWaitTime = 0;
    if (completedTickets.length > 0) {
      const totalWaitTime = completedTickets.reduce((sum, ticket) => {
        return sum + (ticket.calledAt - ticket.createdAt);
      }, 0);
      avgWaitTime = Math.round(totalWaitTime / completedTickets.length / 1000 / 60);
    }

    // Calculate average service time
    const servedTickets = await Ticket.find({
      status: 'completed',
      createdAt: { $gte: today },
      servedAt: { $ne: null },
      completedAt: { $ne: null }
    });

    let avgServiceTime = 0;
    if (servedTickets.length > 0) {
      const totalServiceTime = servedTickets.reduce((sum, ticket) => {
        return sum + (ticket.completedAt - ticket.servedAt);
      }, 0);
      avgServiceTime = Math.round(totalServiceTime / servedTickets.length / 1000 / 60);
    }

    // Get counts by service type
    const serviceStats = await Ticket.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: '$serviceType', count: { $sum: 1 } } }
    ]);

    // Get online agents count
    const onlineAgents = await Agent.countDocuments({ isOnline: true, isActive: true });
    const totalAgents = await Agent.countDocuments({ isActive: true });

    // Get hourly distribution
    const hourlyStats = await Ticket.aggregate([
      { $match: { createdAt: { $gte: today } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalToday,
          waiting,
          serving,
          completed,
          cancelled,
          noShow
        },
        performance: {
          avgWaitTime,
          avgServiceTime,
          throughputRate: completed > 0 ? Math.round(completed / ((Date.now() - today) / 1000 / 3600)) : 0
        },
        agents: {
          online: onlineAgents,
          total: totalAgents
        },
        byService: serviceStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        hourlyDistribution: hourlyStats.map(item => ({
          hour: item._id,
          count: item.count
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

// Get agent performance stats
exports.getAgentStats = async (req, res) => {
  try {
    // Only return agents with role 'agent', exclude admin and supervisor
    const agents = await Agent.find({ isActive: true, role: 'agent' })
      .select('firstName lastName counterNumber ticketsServedToday averageServiceTime isOnline currentTicket services')
      .populate('currentTicket', 'ticketNumber serviceType');

    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching agent stats',
      error: error.message
    });
  }
};

// Get queue status (for display)
exports.getQueueStatus = async (req, res) => {
  try {
    // Get current serving tickets
    const servingTickets = await Ticket.find({ status: { $in: ['called', 'serving'] } })
      .populate('servedBy', 'firstName lastName counterNumber')
      .sort({ calledAt: -1 })
      .limit(10);

    // Get next waiting tickets
    const waitingTickets = await Ticket.find({ status: 'waiting' })
      .sort({ priority: -1, createdAt: 1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        nowServing: servingTickets,
        nextInQueue: waitingTickets
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching queue status',
      error: error.message
    });
  }
};

