import assert from 'assert';
import crypto from 'crypto';
import { 
  formatGuestConfirmationMessage, 
  formatStaffAlertMessage, 
  dispatchWhatsAppMessage, 
  generateWhatsAppDirectLink 
} from '../src/services/whatsappDispatcher.js';
import { 
  generateSignedPassPayload, 
  verifySignedPass, 
  generatePrintableVoucherHtml 
} from '../src/services/digitalPassService.js';
import { 
  generateLuxuryInvoiceHtml, 
  sendEmailInvoice, 
  NIGERIAN_VAT_RATE 
} from '../src/services/invoiceService.js';
import fs from 'fs';
import path from 'path';
import { TRACK_INFO } from '../src/services/audioService.js';

console.log('================================================================');
console.log('🏨 RUNNING TEST SUITE: MODULE 4 (Automated Dispatch & Comms)');
console.log('================================================================\n');

let passedTests = 0;
const runTest = (name, fn) => {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exit(1);
  }
};

const runAsyncTest = async (name, fn) => {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exit(1);
  }
};

async function executeTestSuite() {
  const sampleBooking = {
    reference: 'OXY-489218',
    guestName: 'Babatunde Adeleke',
    guestPhone: '+2348060648413',
    guestEmail: 'babatunde@example.com',
    roomName: 'Deluxe King Room',
    roomUnit: 'Room 204 (1st Floor)',
    checkIn: '2026-10-02',
    checkOut: '2026-10-04',
    nights: 2,
    guests: 2,
    totalFormatted: '₦110,400',
    roomPricePerNight: 48000,
    addons: [
      { name: 'Moniya Train VIP Pickup', price: 10000 },
      { name: 'Romantic Rooftop Dinner', price: 35000 },
    ],
    paymentMethod: 'PAYSTACK',
    specialRequests: 'Arriving on 2:30 PM Lagos train from Mobolaji Johnson Station',
  };

  // -------------------------------------------------------------
  // TEST GROUP 1: CARD 4.1 - WhatsApp Cloud API Dispatcher
  // -------------------------------------------------------------
  console.log('📦 TEST GROUP 1: WhatsApp Cloud Dispatcher (Card 4.1)');

  runTest('Formats luxury guest confirmation with reference, dates, and Moniya train advice', () => {
    const text = formatGuestConfirmationMessage(sampleBooking);
    assert.ok(text.includes('OXYGEN ORBIS HOTEL & RESORT'));
    assert.ok(text.includes('#OXY-489218'));
    assert.ok(text.includes('Room 204'));
    assert.ok(text.includes('10-15 minutes'));
    assert.ok(text.includes('Moniya Railway Station'));
    assert.ok(text.includes('Moniya Train VIP Pickup'));
  });

  runTest('Formats reception staff alert message with chauffeur action notice', () => {
    const text = formatStaffAlertMessage(sampleBooking);
    assert.ok(text.includes('FRONT DESK PMS'));
    assert.ok(text.includes('#OXY-489218'));
    assert.ok(text.includes('Moniya Train Chauffeur Pickup Scheduled'));
    assert.ok(text.includes('Babatunde Adeleke'));
  });

  await runAsyncTest('Dispatches WhatsApp message with recipient sanitization and delivery latency metrics', async () => {
    const res = await dispatchWhatsAppMessage({
      recipientPhone: '0806 064 8413', // Local spaced format
      message: 'Your stay at Oxygen Orbis is confirmed!',
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.recipient, '+2348060648413'); // Normalized to E.164
    assert.ok(res.messageId.startsWith('wamid.'));
    assert.ok(res.deliveredAt);
  });

  runTest('Generates direct WhatsApp universal URL with encoded payload', () => {
    const link = generateWhatsAppDirectLink('+2348060648413', 'Hello Oxygen Orbis!');
    assert.ok(link.startsWith('https://wa.me/2348060648413?text=Hello%20Oxygen%20Orbis!'));
  });

  // -------------------------------------------------------------
  // TEST GROUP 2: CARD 4.2 - Digital Stay Pass & Signed QR Code
  // -------------------------------------------------------------
  console.log('\n📦 TEST GROUP 2: Cryptographic Stay Pass & QR Generator (Card 4.2)');

  const secret = 'oxy_test_secret_key_881';

  runTest('Generates tamper-proof stay pass with HMAC-SHA256 signature', () => {
    const pass = generateSignedPassPayload(sampleBooking, secret);
    assert.strictEqual(pass.passData.ref, 'OXY-489218');
    assert.strictEqual(pass.passData.unit, 'Room 204 (1st Floor)');
    assert.ok(pass.signature);
    assert.strictEqual(pass.signature.length, 64); // SHA-256 hex string length
    assert.ok(pass.qrString.includes(pass.signature));
  });

  runTest('Front desk scanner verifies authentic signed QR code pass in constant time', () => {
    const { qrString } = generateSignedPassPayload(sampleBooking, secret);
    const verification = verifySignedPass(qrString, secret);

    assert.strictEqual(verification.isValid, true);
    assert.strictEqual(verification.pass.ref, 'OXY-489218');
    assert.strictEqual(verification.pass.guest, 'Babatunde Adeleke');
  });

  runTest('Front desk scanner detects and rejects tampered QR pass (e.g. hacker changed room unit)', () => {
    const { qrString } = generateSignedPassPayload(sampleBooking, secret);
    const parsed = JSON.parse(qrString);

    // Guest attempts to upgrade themselves to Presidential Suite in QR payload
    parsed.unit = 'Penthouse 401 (Presidential)';
    const tamperedQrString = JSON.stringify(parsed);

    const verification = verifySignedPass(tamperedQrString, secret);
    assert.strictEqual(verification.isValid, false);
    assert.ok(verification.error.includes('signature mismatch'));
  });

  runTest('Front desk scanner rejects unsigned or counterfeit QR pass', () => {
    const counterfeitQrString = JSON.stringify({
      ref: 'OXY-FAKE-999',
      guest: 'Intruder',
      unit: 'Room 204',
    });

    const verification = verifySignedPass(counterfeitQrString, secret);
    assert.strictEqual(verification.isValid, false);
    assert.ok(verification.error.includes('Missing cryptographic signature'));
  });

  runTest('Generates complete printable voucher HTML with A4 styling and print controls', () => {
    const html = generatePrintableVoucherHtml(sampleBooking);
    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('OXYGEN ORBIS'));
    assert.ok(html.includes('#OXY-489218'));
    assert.ok(html.includes('window.print()'));
    assert.ok(html.includes('@page { size: A4;'));
  });

  // -------------------------------------------------------------
  // TEST GROUP 3: CARD 4.3 - Branded HTML Invoicing & Email Dispatch
  // -------------------------------------------------------------
  console.log('\n📦 TEST GROUP 3: Branded HTML Invoicing & Nigerian VAT (Card 4.3)');

  runTest('Enforces 7.5% statutory Nigerian Value Added Tax rate', () => {
    assert.strictEqual(NIGERIAN_VAT_RATE, 0.075);
  });

  runTest('Generates luxury HTML invoice with Obsidian & Gold branding, VAT and itemized breakdown', () => {
    const html = generateLuxuryInvoiceHtml(sampleBooking);
    assert.ok(html.includes('OXYGEN ORBIS'));
    assert.ok(html.includes('INV-OXY489218'));
    assert.ok(html.includes('Deluxe King Room Accommodation'));
    assert.ok(html.includes('Moniya Train VIP Pickup'));
    assert.ok(html.includes('Romantic Rooftop Dinner'));
    assert.ok(html.includes('VAT (7.5% Included)'));
    assert.ok(html.includes('✓ PAID IN FULL'));
    assert.ok(html.includes('TIN: 24891048-0001'));
  });

  await runAsyncTest('Dispatches transactional email invoice to guest with delivery confirmation', async () => {
    const res = await sendEmailInvoice({
      recipientEmail: 'babatunde@example.com',
      booking: sampleBooking,
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.recipient, 'babatunde@example.com');
    assert.ok(res.messageId.startsWith('msg_'));
    assert.ok(res.deliveredAt);
    assert.ok(res.htmlLength > 500);
  });

  // -------------------------------------------------------------
  // TEST GROUP 4: CARD 4.4 - Ambient Afro-Lounge Sound System
  // -------------------------------------------------------------
  console.log('\n📦 TEST GROUP 4: Ambient Afro-Lounge Sound System (Card 4.4)');

  runTest('Validates TRACK_INFO metadata (Cool Jazz Lounge, subtitle, audio file paths)', () => {
    assert.strictEqual(TRACK_INFO.title, 'Oxygen Orbis • Cool Jazz Lounge');
    assert.strictEqual(TRACK_INFO.subtitle, 'Smooth Tenor Sax & Velvet Rhodes Piano');
    assert.strictEqual(TRACK_INFO.src, '/audio/oxygen-cool-jazz-lounge.mp3');
    assert.ok(TRACK_INFO.fallbackSrc.startsWith('https://'));
  });

  runTest('Verifies authentic Cool Jazz Lounge and Yoruba audio files exist in public/audio with valid file size (>1MB)', () => {
    const jazzPath = path.resolve('public', 'audio', 'oxygen-cool-jazz-lounge.mp3');
    const shekerePath = path.resolve('public', 'audio', 'oxygen-yoruba-talking-drum-shekere.mp3');
    const dundunPath = path.resolve('public', 'audio', 'oxygen-yoruba-traditional-dundun.mp3');
    assert.ok(fs.existsSync(jazzPath), 'Cool Jazz audio file must exist in public/audio');
    assert.ok(fs.existsSync(shekerePath), 'Talking drum & shekere file must exist in public/audio');
    assert.ok(fs.existsSync(dundunPath), 'Dundun ensemble file must exist in public/audio');
    const jazzStats = fs.statSync(jazzPath);
    const shekereStats = fs.statSync(shekerePath);
    const dundunStats = fs.statSync(dundunPath);
    assert.ok(jazzStats.size > 1000000, `Cool Jazz size (${jazzStats.size} bytes) must exceed 1MB`);
    assert.ok(shekereStats.size > 1000000, `Talking drum & shekere size (${shekereStats.size} bytes) must exceed 1MB`);
    assert.ok(dundunStats.size > 1000000, `Dundun ensemble size (${dundunStats.size} bytes) must exceed 1MB`);
  });

  console.log('\n================================================================');
  console.log(`📊 MODULE 4 SUMMARY: ${passedTests}/${passedTests} TESTS PASSED`);
  console.log('🎉 ALL MODULE 4 TESTS (WHATSAPP, PASSES & INVOICES) PASSED PERFECTLY!');
  console.log('================================================================\n');
}

executeTestSuite();
