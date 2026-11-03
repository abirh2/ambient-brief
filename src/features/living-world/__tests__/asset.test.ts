import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

describe('authored island delivery contract', () => {
  it('ships a bounded, self-contained glTF export matching the ownership inventory', () => {
    const inventory = JSON.parse(readFileSync('docs/world-assets/island-inventory.json', 'utf8'));
    const binary = readFileSync(inventory.file);
    expect(binary.toString('utf8', 0, 4)).toBe('glTF');
    expect(binary.readUInt32LE(4)).toBe(2);
    expect(binary.readUInt32LE(8)).toBe(binary.byteLength);
    expect(binary.byteLength).toBeLessThanOrEqual(2 * 1024 * 1024);
    expect(createHash('sha256').update(binary).digest('hex')).toBe(inventory.sha256);
    const document = JSON.parse(binary.toString('utf8', 20, 20 + binary.readUInt32LE(12)));
    expect(document.buffers).toHaveLength(1);
    expect(document.buffers[0].uri).toBeUndefined();
    expect(document.images ?? []).toHaveLength(0);
    expect(document.extensionsRequired ?? []).toEqual([]);
    expect(document.nodes.some((node: { name?: string }) => node.name?.includes('observatory_glazing'))).toBe(true);
    expect(inventory.triangles * 2 + 25_000).toBeLessThanOrEqual(250_000);
    expect(inventory.meshes * 2 + 3).toBeLessThanOrEqual(200);
  });

  it('keeps network owners and persisted settings outside the renderer', () => {
    for (const file of ['WorldEntry.tsx', 'Atmosphere.tsx', 'profile.ts']) {
      const source = readFileSync(`src/features/living-world/renderer/${file}`, 'utf8');
      expect(source).not.toMatch(/(?:from\s+['"][^'"]*(?:lib\/api|providers|stores)|\bfetch\s*\()/);
    }
    const entry = readFileSync('src/features/living-world/renderer/WorldEntry.tsx', 'utf8');
    expect(entry).toContain('import.meta.env.BASE_URL');
  });
});
