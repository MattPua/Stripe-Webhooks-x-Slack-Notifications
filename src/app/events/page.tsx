'use client';

import { STRIPE_EVENT_CATALOG } from '@/lib/stripeEventCatalog';
import { useEffect, useMemo, useState } from 'react';

export default function EventsCatalogPage() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const allEvents = useMemo(
    () =>
      Object.entries(STRIPE_EVENT_CATALOG).flatMap(([group, events]) =>
        events.map((e) => `${e}`),
      ),
    [],
  );

  useEffect(() => {
    // initialize selection to false
    const init: Record<string, boolean> = {};
    for (const e of allEvents) init[e] = false;
    setSelected(init);
  }, [allEvents]);

  const toggleOne = (eventType: string) => {
    setSelected((prev) => ({ ...prev, [eventType]: !prev[eventType] }));
  };

  const toggleGroup = (groupName: string, value: boolean) => {
    const updates: Record<string, boolean> = {};
    for (const e of STRIPE_EVENT_CATALOG[
      groupName as keyof typeof STRIPE_EVENT_CATALOG
    ] || [])
      updates[e] = value;
    setSelected((prev) => ({ ...prev, ...updates }));
  };

  const selectAll = () => {
    const updates: Record<string, boolean> = {};
    for (const e of allEvents) updates[e] = true;
    setSelected(updates);
  };

  const unselectAll = () => {
    const updates: Record<string, boolean> = {};
    for (const e of allEvents) updates[e] = false;
    setSelected(updates);
  };

  const selectedList = Object.entries(selected)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .sort();

  const copySelected = async () => {
    const csv = selectedList.join(',');
    await navigator.clipboard.writeText(csv);
    alert(`Copied ${selectedList.length} events to clipboard`);
  };

  return (
    <main style={{ padding: 24, fontFamily: 'ui-sans-serif, system-ui' }}>
      <h1>Stripe Events Catalog</h1>
      <p style={{ color: '#555' }}>
        Check the events you want to include. Use the Copy button to copy a
        comma-separated list for your allow or deny list env variable.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={selectAll}>Select All</button>
        <button onClick={unselectAll}>Unselect All</button>
        <button onClick={copySelected} disabled={selectedList.length === 0}>
          Copy Selected ({selectedList.length})
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        {Object.entries(STRIPE_EVENT_CATALOG).map(([group, events]) => {
          const groupSelectedCount = events.filter((e) => selected[e]).length;
          const allInGroupSelected = groupSelectedCount === events.length;
          return (
            <section
              key={group}
              style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3 style={{ margin: 0 }}>{group}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => toggleGroup(group, true)}
                    disabled={allInGroupSelected}
                  >
                    Select group
                  </button>
                  <button
                    onClick={() => toggleGroup(group, false)}
                    disabled={groupSelectedCount === 0}
                  >
                    Unselect group
                  </button>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
                {events.map((evt) => (
                  <li
                    key={evt}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 0',
                    }}
                  >
                    <input
                      id={evt}
                      type="checkbox"
                      checked={!!selected[evt]}
                      onChange={() => toggleOne(evt)}
                    />
                    <label htmlFor={evt} style={{ cursor: 'pointer' }}>
                      <code>{evt}</code>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
