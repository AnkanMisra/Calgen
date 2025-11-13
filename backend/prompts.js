// AI Prompts Configuration
// This file contains all LLM prompts used by the application
// Separating prompts makes the code cleaner and easier to maintain

export const EVENT_GENERATION_PROMPT = (eventCount, userInput) => `
You are an intelligent calendar event generator. Based on the user's input "${userInput}", generate ${eventCount} diverse and realistic event titles with detailed, context-aware descriptions that would commonly appear in a calendar.

Requirements:
1. Generate exactly ${eventCount} different event titles
2. Events should be diverse and realistic for a calendar
3. Each event should have an appropriate duration (30 minutes to 4 hours)
4. Each event should have a detailed, relevant description that provides context, objectives, or preparation notes
5. Make events specific and actionable (e.g., "Team Standup Meeting" instead of just "Meeting")
6. Include a mix of work, personal, and academic events if applicable
7. Descriptions should be helpful and informative, adding value beyond just the title
8. Response must be valid JSON format only

Return the response in this exact JSON format:
{
  "events": [
    {
      "title": "Event Title 1",
      "duration": 60,
      "description": "Detailed description explaining what this event involves, objectives, preparation needed, or what to expect"
    },
    {
      "title": "Event Title 2",
      "duration": 30,
      "description": "Context-specific description with relevant details about this particular event"
    },
    {
      "title": "Event Title 3",
      "duration": 90,
      "description": "Informative description that adds value and context to this event"
    }
  ]
}

Duration guidelines:
- Quick tasks: 30-45 minutes
- Standard meetings: 60 minutes
- Long meetings/deep work: 90-180 minutes
- Personal activities: 60-120 minutes
- Exercise: 60-90 minutes
- Study sessions: 90-120 minutes
- Travel: 30-180 minutes
- Appointments: 30-90 minutes
- Hobbies: 60-180 minutes
- Fitness activities: 45-90 minutes
- Professional development: 60-120 minutes

Description guidelines:
- Work events: Include objectives, attendees, preparation needed, agenda items
- Personal activities: Mention location, equipment needed, goals, benefits
- Appointments: Include purpose, what to bring, preparation, expected duration details
- Study sessions: Specify topics, materials needed, study methods, goals
- Fitness activities: Mention type of exercise, intensity level, equipment, goals
- Social events: Include location, dress code, what to expect, who's attending
- Learning activities: Specify skills to learn, prerequisites, tools needed

Note: Events will be scheduled with optimized gaps between them (15 minutes to 1 hour) based on user's preferred start time.
`;

export const EVENT_TYPE_EXAMPLES = {
  gym: "Gym Session - 60 min, Personal Training - 90 min, Cardio Workout - 45 min, Weight Training - 75 min, Yoga Class - 60 min",
  dental:
    "Dental Check-up - 45 min, Teeth Cleaning - 30 min, Orthodontist Visit - 60 min, Teeth Whitening - 30 min",
  medical:
    "Doctor Appointment - 45 min, Blood Test - 15 min, Specialist Consultation - 60 min, Physical Therapy - 60 min",
  work: "Team Meeting - 60 min, 1-on-1 with Manager - 30 min, Client Call - 45 min, Project Review - 90 min, Interview - 60 min",
  study:
    "Study Session - 90 min, Research Work - 120 min, Lecture - 90 min, Group Study - 75 min, Exam Preparation - 120 min",
  social:
    "Coffee Meeting - 60 min, Family Gathering - 90 min, Birthday Party - 180 min, Brunch with Friends - 90 min",
  hobby:
    "Photography Walk - 90 min, Reading Time - 60 min, Art Class - 120 min, Music Practice - 60 min, Gaming Session - 90 min",
  quick:
    "Quick Call - 15 min, Email Check - 10 min, Briefing - 30 min, Status Update - 15 min, Decision Making - 20 min",
};

export const FALLBACK_EVENTS = {
  work: [
    {
      title: "Team Standup Meeting",
      duration: 30,
      description:
        "Daily team sync to discuss progress, blockers, and priorities. Come prepared with yesterday's accomplishments and today's goals.",
    },
    {
      title: "Code Review Session",
      duration: 60,
      description:
        "Review pull requests, provide constructive feedback, and ensure code quality standards. Focus on best practices and potential improvements.",
    },
    {
      title: "Project Planning",
      duration: 90,
      description:
        "Strategic planning session to define project milestones, allocate resources, and establish timelines. Bring project requirements and dependencies.",
    },
    {
      title: "Client Call",
      duration: 45,
      description:
        "Progress update and requirements gathering with client. Prepare demo materials and status reports. Address any concerns or feedback.",
    },
    {
      title: "Documentation Writing",
      duration: 60,
      description:
        "Technical writing session to update API docs, user guides, and internal wikis. Focus on clarity and completeness.",
    },
    {
      title: "Team Retrospective",
      duration: 60,
      description:
        "Reflect on recent sprint, discuss what went well and what could be improved. Create actionable items for team improvement.",
    },
    {
      title: "Sprint Planning",
      duration: 120,
      description:
        "Plan upcoming sprint tasks, estimate effort, and define sprint goals. Review backlog and prioritize features based on business value.",
    },
    {
      title: "One-on-One Meeting",
      duration: 30,
      description:
        "Private discussion with manager about career growth, performance, and current challenges. Prepare questions and achievements.",
    },
    {
      title: "Team Sync",
      duration: 30,
      description:
        "Quick alignment meeting to coordinate ongoing work and resolve immediate issues. Focus on cross-team dependencies.",
    },
    {
      title: "Status Update Meeting",
      duration: 30,
      description:
        "Progress reporting session for stakeholders. Review KPIs, milestones, and upcoming deliverables with leadership team.",
    },
  ],
  personal: [
    {
      title: "Gym Workout",
      duration: 60,
      description:
        "Full-body strength training session. Focus on compound movements and proper form. Bring water bottle and workout towel.",
    },
    {
      title: "Grocery Shopping",
      duration: 45,
      description:
        "Weekly grocery run for fresh produce and essentials. Use shopping list and compare prices. Check pantry inventory before leaving.",
    },
    {
      title: "Reading Time",
      duration: 60,
      description:
        "Dedicated reading session for personal development or leisure. Choose quiet environment and minimize distractions.",
    },
    {
      title: "Meal Prep",
      duration: 45,
      description:
        "Prepare healthy meals for the week. Focus on batch cooking and portion control. Use fresh ingredients and proper storage.",
    },
    {
      title: "Walk in the Park",
      duration: 30,
      description:
        "Refreshing outdoor walk for mental clarity and light exercise. Wear comfortable shoes and enjoy nature. Great for stress relief.",
    },
    {
      title: "Meditation Session",
      duration: 20,
      description:
        "Mindfulness meditation to reduce stress and improve focus. Find quiet space, use guided app if needed. Focus on breathing.",
    },
    {
      title: "Call with Family",
      duration: 60,
      description:
        "Connect with loved ones for personal updates and emotional support. Prepare topics and ensure good connection quality.",
    },
    {
      title: "Hobby Time",
      duration: 90,
      description:
        "Pursue personal interests and creative outlets. Whether it's painting, music, or crafts - enjoy the process without pressure.",
    },
    {
      title: "Coffee with Friends",
      duration: 60,
      description:
        "Social gathering to catch up and strengthen friendships. Choose cozy cafe and prepare conversation topics.",
    },
    {
      title: "Movie Night",
      duration: 120,
      description:
        "Relaxing entertainment with favorite films or series. Prepare snacks and comfortable viewing environment.",
    },
  ],
  academic: [
    {
      title: "Study Session",
      duration: 90,
      description:
        "Focused academic study with active learning techniques. Use Pomodoro method and take structured notes. Minimize distractions.",
    },
    {
      title: "Lecture Review",
      duration: 60,
      description:
        "Review and consolidate lecture material. Create summary sheets and identify areas needing clarification. Use active recall methods.",
    },
    {
      title: "Assignment Work",
      duration: 120,
      description:
        "Dedicated time to work on academic assignments. Break down complex problems and consult resources as needed.",
    },
    {
      title: "Research Reading",
      duration: 75,
      description:
        "Academic literature review and research. Take detailed notes and organize findings. Focus on scholarly sources.",
    },
    {
      title: "Online Course",
      duration: 60,
      description:
        "Engage with online learning modules. Complete exercises and participate in discussions. Apply concepts practically.",
    },
    {
      title: "Group Project Meeting",
      duration: 90,
      description:
        "Collaborative work on academic group projects. Assign tasks, set deadlines, and coordinate efforts. Prepare updates.",
    },
    {
      title: "Exam Preparation",
      duration: 180,
      description:
        "Comprehensive exam review and practice testing. Use study guides and past exams. Create mind maps and flashcards.",
    },
    {
      title: "Note Review",
      duration: 45,
      description:
        "Organize and consolidate class notes. Fill gaps in understanding and create study aids. Use color coding and highlights.",
    },
    {
      title: "Library Study",
      duration: 120,
      description:
        "Quiet research and study session at library. Access academic resources and maintain focus environment.",
    },
    {
      title: "Lab Work",
      duration: 90,
      description:
        "Hands-on laboratory experiments and practical work. Follow safety protocols and document results meticulously.",
    },
  ],
};

export const DURATION_GUIDELINES = {
  physical_activities: { min: 30, max: 180, typical: [60, 90, 120] },
  professional_meetings: { min: 15, max: 120, typical: [30, 45, 60, 90] },
  learning_activities: { min: 45, max: 180, typical: [60, 90, 120] },
  social_activities: { min: 30, max: 240, typical: [60, 90, 120, 180] },
  medical_appointments: { min: 15, max: 90, typical: [30, 45, 60] },
  quick_tasks: { min: 10, max: 30, typical: [15, 20] },
};

export const SCHEDULING_CONSTRAINTS = {
  workingHours: {
    start: 8, // 8 AM
    end: 21, // 9 PM
    weekend: true, // Allow events on weekends
  },
  buffers: {
    betweenEvents: 5, // 5 minutes between events
    beforeWork: 0, // Can start at 8 AM sharp
    afterWork: 0, // Can end at 9 PM sharp
  },
  scheduling: {
    searchIncrement: 15, // Check every 15 minutes
    maxAttempts: 100,
    preferredDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
  },
};
