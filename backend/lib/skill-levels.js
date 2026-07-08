// Helper to calculate a main-skill level from its sub-skill levels.
// Shared by routes/data.js and routes/resources.js.
function calculateMainSkillLevel(subSkills) {
    if (!subSkills || Object.keys(subSkills).length === 0) return 0;

    const levels = Object.values(subSkills);
    const sum = levels.reduce((acc, level) => acc + level, 0);
    return Math.round(sum / levels.length);
}

module.exports = { calculateMainSkillLevel };
