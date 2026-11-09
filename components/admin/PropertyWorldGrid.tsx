"use client";

import { useState } from "react";
import type { AdminProperty } from "../../lib/admin-auth";
import { getWorldDemoData } from "../../lib/world-demo-data";
import { getWorld, worldDetails } from "../../lib/worlds";

export default function PropertyWorldGrid({ properties }: { properties: AdminProperty[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sorted = [...properties].sort((a, b) => a.worldNumber - b.worldNumber);
  const selected = sorted.find((property) => property.id === selectedId) || null;
  const world = selected ? getWorld(selected.worldNumber) : null;
  const details = selected ? (worldDetails[selected.worldNumber] || worldDetails[9]) : null;
  const demo = selected ? getWorldDemoData(selected.worldNumber) : null;

  return (
    <>
      <div className="admin-property-grid">
        {sorted.map((property) => (
          <button
            key={property.id}
            type="button"
            className="admin-property-card"
            onClick={() => setSelectedId(property.id)}
            aria-label={`Open World ${property.worldNumber} details`}
          >
            <span>World {property.worldNumber}</span>
          </button>
        ))}
      </div>

      {selected && world && details && demo && (
        <div
          className="admin-modal open"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedId(null);
          }}
        >
          <section
            className="admin-modal-in admin-world-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`World ${world.n} · ${world.state}`}
            style={{
              ["--world-light" as string]: demo.cardColour.light,
              ["--world-main" as string]: demo.cardColour.main,
              ["--world-dark" as string]: demo.cardColour.dark,
            }}
          >
            <div className="admin-world-modal-accent" aria-hidden="true" />
            <div className="admin-modal-scroll">
              <p className="admin-kicker">Hospitality world</p>
              <h2>World {world.n}</h2>
              <p className="admin-world-modal-lead">{world.state} · {world.property}</p>

              <dl className="admin-world-fields">
                <div>
                  <dt>State number</dt>
                  <dd>{world.n}</dd>
                </div>
                <div>
                  <dt>State</dt>
                  <dd>{world.state}</dd>
                </div>
                <div>
                  <dt>Property</dt>
                  <dd>{world.property}</dd>
                </div>
                <div>
                  <dt>Country</dt>
                  <dd>{world.country}</dd>
                </div>
                <div>
                  <dt>Card colour</dt>
                  <dd>
                    <span className="admin-world-swatches" aria-hidden="true">
                      <span style={{ background: demo.cardColour.light }} />
                      <span style={{ background: demo.cardColour.main }} />
                      <span style={{ background: demo.cardColour.dark }} />
                    </span>
                    Light {demo.cardColour.light} · Main {demo.cardColour.main} · Dark {demo.cardColour.dark} (hue {demo.cardColour.hue}°)
                  </dd>
                </div>
                <div>
                  <dt>Mantra</dt>
                  <dd>{world.mantra}</dd>
                </div>
                <div>
                  <dt>Description</dt>
                  <dd>{world.desc}</dd>
                </div>
                <div>
                  <dt>Experience your State here</dt>
                  <dd>
                    <ol>
                      {details.experiences.map((experience) => (
                        <li key={experience}>{experience}</li>
                      ))}
                    </ol>
                  </dd>
                </div>
                <div>
                  <dt>Scent introduction</dt>
                  <dd>{details.scent}</dd>
                </div>
                <div>
                  <dt>Perfume oil sold at</dt>
                  <dd>{demo.perfumeOilSoldAt}</dd>
                </div>
                <div>
                  <dt>Property Circle (demo)</dt>
                  <dd>
                    <ul>
                      {demo.propertyCircle.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>
            <p className="admin-modal-close">
              <button className="admin-danger-link" type="button" onClick={() => setSelectedId(null)}>
                Close
              </button>
            </p>
          </section>
        </div>
      )}
    </>
  );
}
