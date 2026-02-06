/**
 * Quick test for LinkedIn parser enhancements
 */
import { readFileSync } from 'fs';
import { 
  parsePositions, 
  parseInvitations, 
  parseReactions,
  parseConnections,
  parseLinkedInExport
} from '../lib/linkedin-parser/index';
import { 
  calculateRelationshipHealth, 
  calculateVouchScores,
  generateNetworkIntelligenceReport 
} from '../lib/linkedin-parser/network-intelligence';

const TEST_DATA_DIR = './test-data/linkedin-export';

async function runTests() {
  console.log('=== LinkedIn Parser Enhancement Tests ===\n');

  // Test 1: Parse Positions.csv
  console.log('1. Testing Positions.csv parser...');
  const positionsContent = readFileSync(`${TEST_DATA_DIR}/Positions.csv`, 'utf-8');
  const positions = parsePositions(positionsContent);
  console.log(`   ✓ Parsed ${positions.length} positions`);
  console.log(`   Sample: ${positions[0]?.companyName} - ${positions[0]?.title}`);
  console.log(`   Current positions: ${positions.filter(p => p.isCurrent).length}`);
  
  // Test 2: Parse Invitations.csv
  console.log('\n2. Testing Invitations.csv parser...');
  const invitationsContent = readFileSync(`${TEST_DATA_DIR}/Invitations.csv`, 'utf-8');
  const invitations = parseInvitations(invitationsContent);
  console.log(`   ✓ Parsed ${invitations.length} invitations`);
  const outgoing = invitations.filter(i => i.direction === 'OUTGOING').length;
  const incoming = invitations.filter(i => i.direction === 'INCOMING').length;
  console.log(`   Outgoing: ${outgoing}, Incoming: ${incoming}`);
  
  // Test 3: Parse Reactions.csv
  console.log('\n3. Testing Reactions.csv parser...');
  const reactionsContent = readFileSync(`${TEST_DATA_DIR}/Reactions.csv`, 'utf-8');
  const reactions = parseReactions(reactionsContent);
  console.log(`   ✓ Parsed ${reactions.length} reactions`);
  const reactionTypes = [...new Set(reactions.map(r => r.type))];
  console.log(`   Types: ${reactionTypes.join(', ')}`);
  
  // Test 4: Full export parse with new files
  console.log('\n4. Testing full export parse...');
  const connectionsContent = readFileSync(`${TEST_DATA_DIR}/Connections.csv`, 'utf-8');
  const messagesContent = readFileSync(`${TEST_DATA_DIR}/messages.csv`, 'utf-8');
  
  const fullData = await parseLinkedInExport({
    connections: connectionsContent,
    messages: messagesContent,
    positions: positionsContent,
    invitations: invitationsContent,
    reactions: reactionsContent,
  });
  
  console.log(`   ✓ Connections: ${fullData.connections.length}`);
  console.log(`   ✓ Messages: ${fullData.messages.length}`);
  console.log(`   ✓ Positions: ${fullData.positions.length}`);
  console.log(`   ✓ Invitations: ${fullData.invitations.length}`);
  console.log(`   ✓ Reactions: ${fullData.reactions.length}`);
  console.log(`   ✓ Detected name: ${fullData.myName}`);
  
  // Test 5: Network Intelligence with positions
  console.log('\n5. Testing Network Intelligence with position data...');
  const healthScores = calculateRelationshipHealth(fullData);
  const strongRelationships = healthScores.filter(h => h.status === 'strong');
  const withPositionModifiers = healthScores.filter(h => 
    h.modifiers?.some(m => m.includes('shared_company') || m.includes('they_initiated'))
  );
  console.log(`   ✓ Calculated health for ${healthScores.length} connections`);
  console.log(`   Strong relationships: ${strongRelationships.length}`);
  console.log(`   With position-based modifiers: ${withPositionModifiers.length}`);
  
  // Show some examples of position-based modifiers
  if (withPositionModifiers.length > 0) {
    console.log('   Sample modifiers:');
    withPositionModifiers.slice(0, 3).forEach(h => {
      console.log(`     - ${h.connection.fullName}: ${h.modifiers?.join(', ')}`);
    });
  }
  
  // Test 6: Vouch scores with shared history
  console.log('\n6. Testing Vouch Scores with shared history...');
  const vouchScores = calculateVouchScores(fullData);
  const withSharedHistory = vouchScores.filter(v => v.factors.sharedHistory > 0);
  console.log(`   ✓ Calculated vouch scores for ${vouchScores.length} connections`);
  console.log(`   With shared history factor: ${withSharedHistory.length}`);
  
  if (withSharedHistory.length > 0) {
    console.log('   Top shared history scores:');
    withSharedHistory.slice(0, 3).forEach(v => {
      console.log(`     - ${v.connection.fullName}: sharedHistory=${v.factors.sharedHistory}, total=${v.score}`);
    });
  }
  
  console.log('\n=== All Tests Passed ✓ ===');
}

runTests().catch(console.error);
