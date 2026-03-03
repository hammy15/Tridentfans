/**
 * Weekly Content Preparation Script
 * Generates content for approval throughout the week
 */

const { prepareDailyContent, queueContentForApproval } = require('../lib/game-thread-automation.ts');
const fs = require('fs');
const path = require('path');

// Create approval directory if it doesn't exist
const approvalDir = path.join(__dirname, '../content/approval-queue');
if (!fs.existsSync(approvalDir)) {
  fs.mkdirSync(approvalDir, { recursive: true });
}

async function generateWeeklyContent() {
  console.log('🎯 Generating weekly TridentFans content...');
  
  try {
    const content = await prepareDailyContent();
    
    // Generate game threads
    console.log(`\n📋 GAME THREADS (${content.game_threads.length}):`);
    for (let i = 0; i < content.game_threads.length; i++) {
      const thread = content.game_threads[i];
      const filename = `game-thread-${i + 1}-${Date.now()}.md`;
      
      const approvalContent = `# Game Thread Approval Request

**Title:** ${thread.title}
**Game:** ${thread.game_info.opponent} (${thread.game_info.date})
**Status:** PENDING APPROVAL ⏳

---

## CONTENT TO POST:

${thread.content}

---

## DISCUSSION STARTERS:
${thread.discussion_starters.map(q => `- ${q}`).join('\n')}

---

## KEYS TO VICTORY:
${thread.keys_to_victory.map(k => `- ${k}`).join('\n')}

---

**ACTIONS:**
✅ **APPROVE** - Ready to post  
✏️ **EDIT** - Needs changes  
❌ **REJECT** - Skip this one  

**Mark** ⚓`;

      const filepath = path.join(approvalDir, filename);
      fs.writeFileSync(filepath, approvalContent);
      
      console.log(`   ✅ ${thread.title}`);
      console.log(`      📄 ${filepath}`);
    }
    
    // Generate discussion posts
    console.log(`\n💬 DISCUSSION POSTS (${content.discussion_posts.length}):`);
    for (let i = 0; i < content.discussion_posts.length; i++) {
      const post = content.discussion_posts[i];
      const filename = `discussion-${post.type}-${Date.now()}.md`;
      
      const approvalContent = `# Discussion Post Approval Request

**Title:** ${post.title}
**Type:** ${post.type}
**Status:** PENDING APPROVAL ⏳

---

## CONTENT TO POST:

# ${post.title}

${post.content}

---

**ACTIONS:**
✅ **APPROVE** - Ready to post  
✏️ **EDIT** - Needs changes  
❌ **REJECT** - Skip this one  

**Mark** ⚓`;

      const filepath = path.join(approvalDir, filename);
      fs.writeFileSync(filepath, approvalContent);
      
      console.log(`   ✅ ${post.title}`);
      console.log(`      📄 ${filepath}`);
    }

    // Generate prediction posts
    console.log(`\n🎯 PREDICTION POSTS (${content.prediction_posts.length}):`);
    for (let i = 0; i < content.prediction_posts.length; i++) {
      const post = content.prediction_posts[i];
      const filename = `prediction-${post.type}-${Date.now()}.md`;
      
      const approvalContent = `# Prediction Post Approval Request

**Title:** ${post.title}
**Type:** ${post.type}
**Status:** PENDING APPROVAL ⏳

---

## CONTENT TO POST:

# ${post.title}

${post.content}

**What's your prediction? Drop your takes below!**

**Go M's!** ⚓

---

**ACTIONS:**
✅ **APPROVE** - Ready to post  
✏️ **EDIT** - Needs changes  
❌ **REJECT** - Skip this one  

**Mark** ⚓`;

      const filepath = path.join(approvalDir, filename);
      fs.writeFileSync(filepath, approvalContent);
      
      console.log(`   ✅ ${post.title}`);
      console.log(`      📄 ${filepath}`);
    }

    console.log(`\n🎯 Content generation complete!`);
    console.log(`📂 Review files in: ${approvalDir}`);
    console.log(`\n**Ready for your approval to post on TridentFans!**`);
    
  } catch (error) {
    console.error('❌ Error generating content:', error);
  }
}

// Today's special content ideas
function generateTodaySpecial() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  const specialContent = {
    0: { // Sunday
      title: "Sunday Funday: Bold Predictions Thread",
      content: "New week, new possibilities. What's your boldest prediction for this week's games?"
    },
    1: { // Monday  
      title: "Manic Monday: What Went Right/Wrong This Weekend",
      content: "Monday morning quarterbacking time. What did we learn from the weekend series?"
    },
    2: { // Tuesday
      title: "Trade Talk Tuesday",
      content: "Jerry Dipoto is always cooking something. What moves do you want to see?"
    },
    3: { // Wednesday
      title: "Wisdom Wednesday: Mariners History Lesson", 
      content: "On this day in Mariners history... Let's remember some franchise moments."
    },
    4: { // Thursday
      title: "Throwback Thursday: Favorite Mariners Memory",
      content: "Share your favorite Mariners memory. What moment made you a fan for life?"
    },
    5: { // Friday
      title: "Friday Feelings: Weekend Series Preview",
      content: "Weekend baseball is the best baseball. What are you most excited about?"
    },
    6: { // Saturday
      title: "Saturday Spotlight: Player of the Week",
      content: "Who's been our MVP this week? Time to give credit where it's due."
    }
  };
  
  return specialContent[dayOfWeek];
}

// Export for use in other scripts
module.exports = {
  generateWeeklyContent,
  generateTodaySpecial,
  approvalDir
};

// Run if called directly
if (require.main === module) {
  generateWeeklyContent();
}