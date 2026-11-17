// The six features: what the list says, the panel's colour, and the
// notification shown on the panel. The dot patterns are in patterns.js, in
// the same order.

const GREEN = '#2bd655';

const moon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2Z" fill="currentColor"/></svg>';
const wallet =
  '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><rect x="3.5" y="6.5" width="17" height="11" rx="2.6"/><circle cx="16" cy="12" r="1.25" fill="currentColor" stroke="none"/></svg>';
const check =
  '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 12.5 3.6 3.6 7.4-8"/></svg>';

/** One round avatar: initials, an emoji or an icon on a colour. */
const avatar = (content, colour) => `<span class="avatar" style="--avatar:${colour}">${content}</span>`;

/** The top row every card shares. */
const row = ({ avatars, name, detail, amount, amountClass = '' }) => `
  <div class="notice__row">
    <span class="avatars">${avatars}</span>
    <span class="notice__who"><strong>${name}</strong><span>${detail}</span></span>
    <span class="notice__amount ${amountClass}">${amount}</span>
  </div>`;

const meter = (percent, left, right) => `
  <div class="meter"><i style="width:${percent}%"></i></div>
  <div class="notice__foot"><span>${left}</span><span>${right}</span></div>`;

export const FEATURES = [
  {
    title: 'Payday',
    text: 'The day your salary lands, Doze moves a slice into savings. Before you can spend it. Before you even notice.',
    colour: GREEN,
    card: `
      <span class="pill pill--above">+$320.00 to Doze</span>
      ${row({ avatars: avatar('A', '#000'), name: 'Apple', detail: 'Salary · Fri, 9:00 AM', amount: '$3,200.00' })}`,
  },
  {
    title: 'Round-ups',
    text: 'Every coffee, cab and 1am order rounds up to the next dollar. Spare change, but it adds up.',
    colour: '#ec9a26',
    card: `
      <span class="pill pill--corner">+$0.40</span>
      ${row({ avatars: avatar('<span class="avatar__emoji">☕</span>', '#ec9a26'), name: 'Blue Bottle', detail: 'Coffee · 8:14 AM', amount: '$4.60' })}`,
  },
  {
    title: 'Morning',
    text: 'Wake up to one number: what you earned overnight. No charts, no homework.',
    colour: '#7e42ef',
    card: row({ avatars: avatar(moon, GREEN), name: 'Good morning', detail: 'Earned while you slept', amount: '+$1.84', amountClass: 'is-gain' }),
  },
  {
    title: 'Safe to spend',
    text: 'One number that tells you what’s actually yours this week, after rent and bills.',
    colour: '#f2642d',
    card: `
      ${row({ avatars: avatar(wallet, '#f2642d'), name: 'Safe to spend', detail: 'Until Sunday', amount: '$214.00' })}
      ${meter(64, 'Rent and bills covered', '64% left')}`,
  },
  {
    title: 'Group pots',
    text: 'Saving for the trip with friends? Open a pot, invite the group, and see who’s actually paying in.',
    colour: '#f13f96',
    card: `
      ${row({
        avatars: avatar('SJ', '#f2642d') + avatar('SW', '#3a59f7') + avatar('TC', '#f13f96'),
        name: 'Lisbon trip',
        detail: '3 friends, one pot',
        amount: '$1,240',
      })}
      ${meter(62, 'Goal $2,000', '62%')}`,
  },
  {
    title: 'Anytime',
    text: 'Your money, whenever you want it. No lock-ins, no penalties, no “are you sure?” screens.',
    colour: '#3a59f7',
    card: `
      ${row({ avatars: avatar('SJ', '#f2642d'), name: 'Steve Jobs', detail: '•••• 4821', amount: '$500.00', amountClass: 'is-gain' })}
      <span class="pill pill--below"><i class="pill__check">${check}</i>Arrived in 4s</span>`,
  },
];
