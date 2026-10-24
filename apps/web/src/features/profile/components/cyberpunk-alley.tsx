"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PauseIcon } from "@phosphor-icons/react/dist/ssr/Pause";
import { PlayIcon } from "@phosphor-icons/react/dist/ssr/Play";

import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";

const WIDTH = 480;
const HEIGHT = 720;
// Fixed seed keeps facade wear and lit windows stable between frames.
function randomSource() {
  let seed = 1807;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function paintCity(
  ctx: CanvasRenderingContext2D,
  palette: string[],
  sky: CanvasRenderingContext2D,
  skyline: CanvasRenderingContext2D,
) {
  const random = randomSource();
  const rect = (x: number, y: number, w: number, h: number, shade: number) => {
    ctx.fillStyle = palette[shade];
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const texture = (
    x: number,
    y: number,
    w: number,
    h: number,
    shade: number,
  ) => {
    for (let py = y; py < y + h; py += 2) {
      for (let px = x + (py % 4); px < x + w; px += 4) {
        if (random() > 0.25) rect(px, py, 1, 1, shade);
      }
    }
  };
  const cable = (
    x: number,
    end: number,
    y: number,
    endY: number,
    sag: number,
    shade: number,
    thickness: number,
  ) => {
    for (let px = x; px <= end; px++) {
      const t = (px - x) / (end - x);
      const height = y + (endY - y) * t + 4 * sag * t * (1 - t);
      rect(px, height, 1, thickness, shade);
    }
  };

  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const noiseGrid = Array.from({ length: 4096 }, () => random());
  const noise = (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const at = (dx: number, dy: number) =>
      noiseGrid[((iy + dy) % 64) * 64 + ((ix + dx) % 64)];
    return (
      (at(0, 0) * (1 - sx) + at(1, 0) * sx) * (1 - sy) +
      (at(0, 1) * (1 - sx) + at(1, 1) * sx) * sy
    );
  };
  // Layered coherent noise gives static clouds soft, irregular edges rather than scattered dots.
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const haze = Math.exp(-(((y - 290) / 180) ** 2));
      const cloudNoise =
        noise(x / 78, y / 30) * 0.58 +
        noise(x / 31, y / 13) * 0.29 +
        noise(x / 12, y / 6) * 0.13;
      const cloudBand = Math.exp(-(((y - 130) / 105) ** 2));
      const cloud = Math.max(0, cloudNoise - 0.43) * 19 * cloudBand;
      const neon =
        9 * Math.exp(-(((x - 175) / 65) ** 2 + ((y - 310) / 95) ** 2)) +
        11 * Math.exp(-(((x - 318) / 55) ** 2 + ((y - 270) / 78) ** 2)) +
        6 * Math.exp(-(((x - 250) / 115) ** 2 + ((y - 440) / 140) ** 2));
      const value =
        0.8 +
        (y / HEIGHT) * 3.8 +
        haze * 1.7 +
        cloud +
        neon * (0.8 + cloudNoise * 0.4);
      const base = Math.floor(value);
      const threshold = (bayer[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
      rect(x, y, 1, 1, base + (value - base > threshold ? 1 : 0));
    }
  }
  for (let i = 0; i < 150; i++) {
    rect(random() * WIDTH, random() * 300, 1, 1, 9 + Math.floor(random() * 10));
  }
  const starRandom = randomSource();
  for (let i = 0; i < 1100; i++) {
    const x = Math.floor(starRandom() * WIDTH);
    const y = Math.floor(starRandom() * HEIGHT);
    const brightness = starRandom();
    rect(x, y, 1, 1, 12 + Math.floor(brightness * 17));
    if (brightness > 0.985) {
      rect(x - 1, y, 3, 1, 20);
      rect(x, y - 1, 1, 3, 20);
      rect(x, y, 1, 1, 30);
    }
  }
  for (let y = -25; y <= 25; y++) {
    const radius = Math.floor(Math.sqrt(625 - y * y));
    const innerEdge = Math.floor(radius * 0.43);
    for (let x = innerEdge; x < radius; x++) {
      const crater = noise((x + 303) / 5, (y + 95) / 5);
      rect(303 + x, 95 + y, 1, 1, crater > 0.6 ? 20 : (x + y) % 3 ? 24 : 26);
    }
  }

  sky.drawImage(ctx.canvas, 0, 0);
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Rasterize system Japanese glyphs into hard pixels to match the canvas art.
  const lettering = document.createElement("canvas");
  lettering.width = 72;
  lettering.height = 20;
  const letters = lettering.getContext("2d");
  const label = (
    text: string,
    x: number,
    y: number,
    size: number,
    shade = 28,
  ) => {
    if (!letters) return;
    letters.clearRect(0, 0, 72, 20);
    letters.font = `bold ${size}px "Yu Gothic", "Hiragino Kaku Gothic ProN", "Noto Sans CJK JP", sans-serif`;
    letters.textBaseline = "top";
    letters.fillStyle = "white";
    letters.fillText(text, 0, 0);
    const pixels = letters.getImageData(0, 0, 72, 20).data;
    for (let py = 0; py < 20; py++)
      for (let px = 0; px < 72; px++) {
        if (pixels[(py * 72 + px) * 4 + 3] > 100)
          rect(x + px, y + py, 1, 1, shade);
      }
  };

  const advertisements = [
    "喫茶",
    "ラーメン",
    "映画",
    "電気",
    "深夜営業",
    "ゲーム",
    "書店",
    "音楽",
    "温泉",
    "新発売",
    "旅行",
    "寿司",
    "珈琲",
    "未来通信",
  ];
  const adRandom = randomSource();

  // Flat elevation: towers continue below the frame; no ground or vanishing point.
  for (let layer = 0; layer < 3; layer++) {
    let x = -15;
    while (x < WIDTH) {
      const w = 17 + Math.floor(random() * (40 + layer * 17));
      const top = 170 + layer * 112 + Math.floor(random() * 195);
      const shade = 2 + layer * 2 + Math.floor(random() * 2);
      const style = Math.floor(random() * 4);
      const spacing = 6 + Math.floor(random() * 6);
      const floorHeight = 8 + Math.floor(random() * 7);
      rect(x, top, w, HEIGHT - top, shade);
      if (style === 0) {
        for (let tier = 1; tier <= 3; tier++)
          rect(x + tier * 3, top - tier * 6, w - tier * 6, 6, shade + 1);
      } else if (style === 1) {
        rect(x + 3, top - 15, w / 2, 15, shade + 1);
        rect(x + w - 9, top - 22, 4, 22, shade + 3);
      } else {
        rect(x + 2, top - 3, w - 4, 3, shade + 3);
      }
      if (random() > 0.4) {
        const mast = 13 + Math.floor(random() * 29);
        rect(x + w / 2, top - mast, 1, mast, shade + 2);
        rect(x + w / 2 - 1, top - mast, 3, 1, 9 + layer * 4);
      }
      for (let y = top + 7; y < HEIGHT; y += floorHeight) {
        if (style % 2 === 0) rect(x, y + floorHeight - 2, w, 1, shade - 1);
        const darkFloor = random() < 0.17;
        for (let wx = x + 4; wx < x + w - 4; wx += spacing) {
          if (random() < 0.14) continue;
          const light =
            !darkFloor && random() > 0.4
              ? shade + 1 + Math.floor(random() * (3 + layer * 3))
              : shade - 2;
          rect(
            wx,
            y,
            style === 2 ? spacing - 2 : 2 + Math.floor(random() * 3),
            style === 3 ? floorHeight - 3 : 4,
            light,
          );
          if (light > 15 && random() > 0.5) rect(wx, y + 2, 2, 1, shade + 3);
        }
      }
      if (style === 3)
        for (let rib = x + 2; rib < x + w; rib += spacing)
          rect(rib, top, 1, HEIGHT - top, shade + 2);
      texture(x, top, w, HEIGHT - top, shade + 1);
      rect(x + w - 3, top + 4, 1, HEIGHT - top, shade + 3);
      if (w > 35 && adRandom() > 0.55) {
        const roofText = advertisements[
          Math.floor(adRandom() * advertisements.length)
        ].slice(0, 3);
        rect(x + 6, top - 8, 2, 8, shade + 3);
        rect(x + w - 8, top - 8, 2, 8, shade + 3);
        rect(x + 2, top - 26, w - 4, 18, shade - 1);
        rect(x + 2, top - 26, w - 4, 1, 15 + layer * 4);
        label(roofText, x + 6, top - 23, 10, 17 + layer * 4);
      }
      for (
        let signY = top + 15 + Math.floor(adRandom() * 24);
        signY < HEIGHT - 80;
        signY += 48 + Math.floor(adRandom() * 85)
      ) {
        const text =
          advertisements[Math.floor(adRandom() * advertisements.length)];
        const kind = Math.floor(adRandom() * 5);
        const size = kind === 0 ? 7 : 9 + layer;
        const signWidth =
          kind === 1
            ? 24
            : kind === 2
              ? Math.min(w - 4, 70)
              : kind === 3
                ? size + 5
                : Math.min(w - 4, 28 + Math.floor(adRandom() * 22));
        const signHeight =
          kind === 1
            ? 24
            : kind === 2
              ? 42 + Math.floor(adRandom() * 18)
              : kind === 3
                ? text.length * (size + 2) + 6
                : kind === 4
                  ? 23
                  : 12;
        const signX = Math.round(
          x + 3 + adRandom() * Math.max(0, w - signWidth - 6),
        );
        const glow = 12 + layer * 4 + Math.floor(adRandom() * 4);
        if (kind === 1) {
          // Round projecting logo with a dark center and a single large glyph.
          rect(signX + 12, signY + 9, 16, 2, shade + 4);
          for (let dy = -12; dy <= 12; dy++) {
            const radius = Math.floor(Math.sqrt(144 - dy * dy));
            rect(signX + 12 - radius, signY + 12 + dy, radius * 2, 1, glow - 2);
            if (radius > 2)
              rect(
                signX + 14 - radius,
                signY + 12 + dy,
                radius * 2 - 4,
                1,
                shade,
              );
          }
          label(text[0], signX + 6, signY + 5, 13, glow);
        } else if (kind === 2) {
          // Large product poster: illustration dominates, with a short Japanese caption.
          rect(signX - 1, signY - 1, signWidth + 2, signHeight + 2, shade + 3);
          rect(signX, signY, signWidth, signHeight, glow - 7);
          const center = Math.floor(signX + signWidth / 2);
          if (adRandom() > 0.5) {
            rect(center - 3, signY + 7, 6, 5, glow);
            rect(center - 5, signY + 12, 10, 19, shade);
            rect(center - 4, signY + 17, 8, 9, glow);
            rect(center - 2, signY + 18, 2, 7, glow - 6);
            label(
              "炭酸",
              signX + 3,
              signY + signHeight - 12,
              Math.min(10, Math.floor((signWidth - 6) / 2)),
              glow,
            );
          } else {
            for (let bowl = 0; bowl < 8; bowl++)
              rect(
                center - 9 + bowl,
                signY + 19 + bowl,
                18 - bowl * 2,
                1,
                glow,
              );
            rect(center - 10, signY + 17, 20, 2, glow - 3);
            for (let steam = 0; steam < 3; steam++)
              rect(
                center - 6 + steam * 5,
                signY + 8 + (steam % 2) * 2,
                1,
                6,
                glow - 1,
              );
            label("麺", center - 5, signY + signHeight - 13, 11, glow);
          }
          for (let stripe = 3; stripe < signHeight - 3; stripe += 5)
            rect(signX + signWidth - 3, signY + stripe, 1, 2, glow - 4);
        } else if (kind === 3) {
          // Borderless neon letters on a narrow hanging blade.
          rect(signX, signY, signWidth, signHeight, shade - 1);
          rect(signX, signY, 1, signHeight, glow - 4);
          Array.from(text).forEach((letter, index) =>
            label(
              letter,
              signX + 3,
              signY + 3 + index * (size + 2),
              size,
              glow,
            ),
          );
        } else {
          rect(
            signX,
            signY,
            signWidth,
            signHeight,
            kind === 0 ? glow - 3 : shade - 1,
          );
          label(
            text.slice(0, Math.max(1, Math.floor((signWidth - 6) / size))),
            signX + 3,
            signY + 2,
            size,
            kind === 0 ? shade : glow,
          );
          if (kind === 4) {
            rect(signX, signY + signHeight - 7, signWidth, 7, glow - 5);
            for (let bulb = 3; bulb < signWidth - 2; bulb += 5)
              rect(signX + bulb, signY + signHeight - 4, 2, 2, glow);
          }
        }
        signY += Math.max(0, signHeight - 25);
      }
      x += w + 3 + Math.floor(random() * 10);
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.65;
  ctx.translate(0, HEIGHT);
  ctx.scale(1, 0.55);
  for (const [x, radius, shade] of [
    [160, 95, 24],
    [265, 125, 20],
    [342, 75, 27],
  ]) {
    const glow = ctx.createRadialGradient(x, 24, 0, x, 24, radius);
    glow.addColorStop(0, palette[shade]);
    glow.addColorStop(0.25, palette[18]);
    glow.addColorStop(0.6, palette[8]);
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius, 24 - radius, radius * 2, radius);
  }
  ctx.restore();

  skyline.drawImage(ctx.canvas, 0, 0);
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Nearby upper floors frame the distant city as front-facing facades.
  for (const [left, width] of [
    [0, 104],
    [376, 104],
  ]) {
    rect(left, 0, width, HEIGHT, 5);
    rect(left + 3, 0, width - 6, HEIGHT, 7);
    for (let y = 0; y < HEIGHT; y += 9) {
      rect(left + 3, y, width - 6, 1, 10);
      for (let x = left + 3; x < left + width - 4;) {
        const brickWidth = Math.min(
          10 + Math.floor(random() * 24),
          left + width - 3 - x,
        );
        rect(x, y + 1, brickWidth - 1, 7, 5 + Math.floor(random() * 6));
        rect(x, y, 1, 9, 4);
        if (random() > 0.4)
          rect(x + 2, y + 2, Math.max(1, brickWidth - 6), 1, 11);
        if (random() > 0.7) rect(x + 3, y + 5, 3, 2, 3);
        x += brickWidth;
      }
    }
    texture(left + 4, 0, width - 8, HEIGHT, 9);
    for (let floor = 0; floor < 9; floor++) {
      const y = floor * 85 - 16;
      rect(left, y + 68, width, 4, 12);
      rect(left, y + 72, width, 3, 3);
      for (let col = 0; col < 2; col++) {
        const x = left + 12 + col * 45;
        const lit = random() > 0.3;
        rect(x - 3, y - 3, 34, 49, 13);
        rect(x - 1, y - 1, 30, 45, 2);
        rect(x + 2, y + 2, 24, 38, lit ? 19 + Math.floor(random() * 6) : 5);
        texture(x + 2, y + 2, 24, 38, lit ? 16 : 7);
        const pattern = Math.floor(random() * 4);
        if (lit) {
          if (pattern === 0) {
            const blinds = 2 + Math.floor(random() * 8);
            for (let slat = 0; slat < blinds; slat++)
              rect(x + 2, y + 3 + slat * 4, 24, 2, 12);
          } else if (pattern === 1) {
            rect(x + 2, y + 2, 5 + random() * 9, 38, 11);
            rect(x + 22, y + 2, 4, 38, 15);
          } else {
            for (let patch = 0; patch < 5; patch++)
              rect(
                x + 3 + random() * 15,
                y + 4 + random() * 25,
                3 + random() * 5,
                4 + random() * 7,
                12 + Math.floor(random() * 14),
              );
          }
          rect(x + 3 + random() * 16, y + 29, 4 + random() * 6, 10, 8);
        } else {
          rect(x + 3, y + 5, 2, 12 + random() * 18, 10);
        }
        if (pattern !== 2) rect(x + 13, y, 2, 43, 4);
        rect(x, y + (pattern === 3 ? 12 : 22), 28, 2, 4);
        rect(x - 4, y + 44, 36, 3, 17);
        rect(x - 2, y + 47, 32, 2, 3);
        rect(x + 10, y + 52, 21, 12, 11);
        for (let slat = 0; slat < 4; slat++)
          rect(x + 12, y + 54 + slat * 2, 17, 1, 3);
        rect(x + 8, y + 61, 2, 5, 18);
      }
    }
    for (let i = 0; i < 150; i++) {
      rect(
        left + random() * width,
        random() * HEIGHT,
        1,
        2 + random() * 9,
        random() > 0.5 ? 4 : 12,
      );
    }
  }

  for (const left of [0, 376]) {
    rect(left, 0, 104, 7, 3);
    rect(left, 0, 104, 2, 18);
    rect(left + 3, 3, 98, 1, 10);
  }

  // Exposed conduits, pipe clamps and narrow maintenance platforms.
  for (const x of [96, 379, 387]) {
    rect(x, 0, 4, HEIGHT, 3);
    rect(x + 1, 0, 1, HEIGHT, 16);
    for (let y = 18; y < HEIGHT; y += 43) rect(x - 2, y, 8, 2, 20);
  }
  for (let y = 41; y < HEIGHT; y += 85) {
    const direction = ((y - 41) / 85) % 2 === 0 ? 1 : -1;
    const stairX = (drop: number) =>
      108 + (direction === 1 ? drop : 85 - drop) * 0.56;
    // Side elevation: each floor reverses the flight, with horizontal treads and vertical risers.
    for (let drop = 0; drop < 85; drop++) {
      const x = stairX(drop);
      rect(x, y + drop + 3, 2, 2, 12);
      rect(x, y + drop - 17, 2, 2, 18);
    }
    for (let drop = 0; drop < 85; drop += 5) {
      const x = stairX(drop);
      rect(direction === 1 ? x : x - 3, y + drop, 5, 2, 20);
      rect(direction === 1 ? x + 3 : x - 3, y + drop, 1, 5, 15);
      if (drop % 15 === 0) rect(x, y + drop - 16, 1, 17, 13);
    }
    rect(101, y, 63, 3, 17);
    rect(101, y + 3, 63, 2, 3);
    rect(103, y - 19, 59, 2, 16);
    for (let x = 103; x <= 162; x += 10) rect(x, y - 17, 1, 17, 13);
  }
  const wireRandom = randomSource();
  for (let i = 0; i < 18; i++) {
    const start = 93 + Math.floor(wireRandom() * 12);
    const end = 375 + Math.floor(wireRandom() * 14);
    const y = 100 + wireRandom() * 420;
    const endY = y - 85 + wireRandom() * 170;
    const sag = 12 + wireRandom() * 76;
    const thickness = i % 5 === 0 ? 2 : 1;
    cable(start, end, y, endY, sag, i % 4 === 0 ? 7 : 1, thickness);
    if (i % 3 === 0) cable(start, end, y + 4, endY + 2, sag + 5, 3, 1);
    rect(start - 2, y - 2, 5, 4, 12);
    rect(end - 2, endY - 2, 5, 4, 12);
    if (i % 2 === 0) {
      const t = 0.2 + wireRandom() * 0.6;
      const px = start + (end - start) * t;
      const py = y + (endY - y) * t + 4 * sag * t * (1 - t);
      rect(px, py - 1, 4, 3, 10);
      rect(px + 1, py + 2, 1, 3 + wireRandom() * 7, 4);
    }
  }

  rect(348, 220, 29, 137, 2);
  rect(350, 222, 25, 133, 13);
  rect(352, 224, 21, 129, 4);
  Array.from("月光ホテル").forEach((letter, i) =>
    label(letter, 355, 232 + i * 23, 15),
  );
  rect(15, 355, 72, 30, 2);
  rect(17, 357, 68, 26, 13);
  rect(19, 359, 64, 22, 5);
  label("深夜喫茶", 25, 362, 13);
  for (const [x, y] of [
    [22, 603],
    [404, 445],
  ]) {
    rect(x, y, 47, 38, 13);
    rect(x + 3, y + 3, 41, 32, 6);
    for (const dx of [1, 44])
      for (const dy of [1, 35]) rect(x + dx, y + dy, 1, 1, 24);
    for (let row = 0; row < 5; row++) rect(x + 7, y + 8 + row * 4, 22, 1, 16);
    rect(x + 34, y + 8, 4, 4, 26);
    texture(x + 4, y + 22, 38, 11, 10);
  }
  rect(218, 366, 3, 109, 16);
  for (let y = 380; y < 432; y += 13) rect(207, y, 25, 2, 19);
  rect(213, 359, 13, 4, 23);
  rect(219, 345, 1, 14, 26);

  const balconyRandom = randomSource();
  for (let floor = 1; floor < 8; floor++) {
    if (floor === 5 || balconyRandom() < 0.28) continue;
    const x = 394 + Math.floor(balconyRandom() * 12);
    const y = floor * 85 + 48;
    const width = 43 + Math.floor(balconyRandom() * 19);
    rect(x, y - 5, width, 5, 5);
    rect(x - 2, y, width + 4, 3, 17);
    rect(x, y + 3, width, 4, 3);
    rect(x + 4, y + 7, 3, 7, 11);
    rect(x + width - 7, y + 7, 3, 7, 11);

    const people = 1 + Math.floor(balconyRandom() * 3);
    for (let person = 0; person < people; person++) {
      const px = x + 9 + person * 13;
      const leaning = balconyRandom() > 0.5;
      const headY = y - (leaning ? 25 : 30);
      const coat = 10 + Math.floor(balconyRandom() * 12);
      rect(px, headY, 5, 6, 23);
      rect(px - 1, headY - 1, 6, 2, 3);
      rect(px + 4, headY + 2, 2, 2, 23);
      rect(px - 1, headY + 6, 8, 12, coat);
      rect(px, headY + 18, 2, y - headY - 18, 3);
      rect(px + 5, headY + 18, 2, y - headY - 18, 3);
      rect(px - 3, headY + 8, 2, 9, coat);
      rect(px + 7, headY + 8, 2, leaning ? 5 : 7, coat);
      rect(px + 7, headY + (leaning ? 12 : 14), 5, 2, 23);
      if (!leaning) rect(px + 10, headY + 10, 3, 4, 27);
    }

    // Railings sit in front of the residents, with hands resting on the top bar.
    rect(x, y - 13, width, 2, 20);
    rect(x, y - 5, width, 1, 10);
    for (let bar = x; bar <= x + width; bar += 7) rect(bar, y - 13, 1, 13, 14);
    rect(x + width - 9, y - 8, 6, 7, 12);
    rect(x + width - 7, y - 17, 2, 9, 18);
    rect(x + width - 11, y - 15, 5, 2, 16);
    rect(x + width - 5, y - 19, 4, 3, 20);
  }
}

function paintRooftops(ctx: CanvasRenderingContext2D, palette: string[]) {
  const rect = (x: number, y: number, w: number, h: number, shade: number) => {
    ctx.fillStyle = palette[shade];
    ctx.fillRect(x, y, w, h);
  };
  for (const left of [0, 376]) {
    rect(left, 49, 104, 2, 18);
    rect(left, 57, 104, 1, 10);
    for (let x = left + 3; x < left + 104; x += 10) {
      rect(x, 49, 1, 15, 14);
    }
  }
  rect(407, 41, 3, 23, 8);
  rect(441, 41, 3, 23, 8);
  rect(407, 54, 37, 2, 12);
  rect(402, 17, 47, 27, 8);
  rect(407, 14, 37, 3, 13);
  rect(413, 11, 25, 3, 16);
  rect(410, 19, 3, 23, 13);
  rect(402, 23, 47, 2, 15);
  rect(402, 37, 47, 2, 15);
  rect(406, 44, 39, 2, 3);
}

function paintSkyMotion(
  ctx: CanvasRenderingContext2D,
  time: number,
  palette: string[],
  stars: { x: number; y: number; phase: number }[],
) {
  ctx.save();
  for (const { x, y, phase } of stars) {
    const sparkle = Math.max(0, Math.sin(time * 2 + phase)) ** 8;
    ctx.globalAlpha = sparkle;
    ctx.fillStyle = palette[30];
    ctx.fillRect(x, y, 1, 1);
    ctx.globalAlpha = sparkle * 0.45;
    ctx.fillRect(x - 1, y, 3, 1);
    ctx.fillRect(x, y - 1, 1, 3);
  }
  for (let comet = 0; comet < 2; comet++) {
    const progress = (time + comet * 3.5) % 9;
    if (progress > 1.4) continue;
    const x = 65 + comet * 95 + progress * 150;
    const y = 45 + comet * 120 + progress * 65;
    for (let trail = 20; trail >= 0; trail--) {
      ctx.globalAlpha = (1 - trail / 21) * Math.sin((progress / 1.4) * Math.PI);
      ctx.fillStyle = palette[trail === 0 ? 31 : 23];
      ctx.fillRect(Math.round(x - trail * 2), Math.round(y - trail), 1, 1);
    }
  }
  ctx.restore();
}

function paintMotion(
  ctx: CanvasRenderingContext2D,
  time: number,
  palette: string[],
) {
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(140 + ((time * (5 + i * 2) + i * 73) % 190));
    const y = 205 + i * 93;
    ctx.fillStyle = palette[15];
    ctx.fillRect(x, y, 14, 3);
    ctx.fillRect(x + 4, y - 2, 7, 2);
    ctx.fillStyle = palette[28];
    ctx.fillRect(x - 3, y + 1, 3, 1);
    ctx.fillRect(x + 12, y, 2, 1);
  }
  ctx.fillStyle = palette[27];
  ctx.globalAlpha = 0.5 + Math.sin(time * 1.7) * 0.25;
  ctx.fillRect(350, 222, 1, 133);
  ctx.fillRect(219, 345, 1, 2);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = palette[20];
  for (let i = 0; i < 70; i++) {
    const y = Math.floor((i * 97 + time * 52) % HEIGHT);
    const x = Math.floor((i * 71 + y * 0.08) % WIDTH);
    ctx.fillRect(x, y, 1, 3);
  }
  ctx.globalAlpha = 1;
}

export function CyberpunkAlley({ loading = false }: { loading?: boolean }) {
  const { resolvedTheme } = useTheme();
  const columnRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ascent = useRef(0);
  const targetAscent = useRef(0);
  const [paused, setPaused] = useState(false);

  useLayoutEffect(() => {
    const column = columnRef.current;
    const panel = panelRef.current;
    const scrollport = column?.closest<HTMLElement>("[data-slot=card-content]");
    if (!column || !panel || !scrollport) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const place = () => {
      if (!desktop.matches) {
        panel.removeAttribute("style");
        return;
      }
      const bounds = scrollport.getBoundingClientRect();
      Object.assign(panel.style, {
        position: "fixed",
        top: `${bounds.top}px`,
        left: `${bounds.left + bounds.width / 2}px`,
        width: `${bounds.width / 2}px`,
        height: `${bounds.height}px`,
      });
    };
    const observer = new ResizeObserver(place);
    observer.observe(scrollport);
    observer.observe(column);
    window.addEventListener("resize", place);
    desktop.addEventListener("change", place);
    place();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      desktop.removeEventListener("change", place);
    };
  }, [loading]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const backdrop = document.createElement("canvas");
    backdrop.width = canvas.width = WIDTH;
    backdrop.height = canvas.height = HEIGHT;
    const background = backdrop.getContext("2d");
    if (!background) return;
    const skyCanvas = document.createElement("canvas");
    const skylineCanvas = document.createElement("canvas");
    skyCanvas.width = skylineCanvas.width = WIDTH;
    skyCanvas.height = skylineCanvas.height = HEIGHT;
    const sky = skyCanvas.getContext("2d");
    const skyline = skylineCanvas.getContext("2d");
    if (!sky || !skyline) return;
    background.fillStyle = getComputedStyle(canvas).color;
    background.fillRect(0, 0, 1, 1);
    const [red, green, blue] = background.getImageData(0, 0, 1, 1).data;
    const palette = Array.from({ length: 32 }, (_, level) => {
      const shade = level / 31;
      const channels = [red, green, blue].map((channel) =>
        Math.round(
          shade < 0.7
            ? channel * (0.08 + (shade / 0.7) * 0.92)
            : channel + (((255 - channel) * (shade - 0.7)) / 0.3) * 0.8,
        ),
      );
      return `rgb(${channels.join(",")})`;
    });
    paintCity(background, palette, sky, skyline);
    const roofCanvas = document.createElement("canvas");
    roofCanvas.width = WIDTH;
    roofCanvas.height = 64;
    const roof = roofCanvas.getContext("2d");
    if (roof) paintRooftops(roof, palette);
    const starRandom = randomSource();
    const sparklingStars = [];
    for (let i = 0; i < 1100; i++) {
      const x = Math.floor(starRandom() * WIDTH);
      const y = Math.floor(starRandom() * HEIGHT);
      const brightness = starRandom();
      if (brightness > 0.95 && y < 430) {
        sparklingStars.push({ x, y, phase: brightness * 1000 });
      }
    }
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    let frame = 0;
    let last = -Infinity;
    let previousTick = 0;
    let topStarted: number | null = null;
    const draw = (time: number) => {
      const height = Math.round(ascent.current);
      ctx.drawImage(skyCanvas, 0, 0);
      if (height === 500 && !motion.matches) {
        topStarted ??= time;
        paintSkyMotion(
          ctx,
          Math.max(0, time - topStarted),
          palette,
          sparklingStars,
        );
      } else {
        topStarted = null;
      }
      ctx.drawImage(skylineCanvas, 0, Math.round(height * 1.05));
      ctx.drawImage(roofCanvas, 0, height - roofCanvas.height);
      ctx.save();
      ctx.translate(0, height);
      ctx.drawImage(backdrop, 0, 0);
      paintMotion(ctx, time, palette);
      ctx.restore();
    };
    const tick = (now: number) => {
      const elapsed = previousTick ? Math.min(now - previousTick, 64) : 16;
      previousTick = now;
      const moving = ascent.current !== targetAscent.current;
      if (visible && !document.hidden && (moving || now - last > 1000 / 12)) {
        const remaining = targetAscent.current - ascent.current;
        ascent.current =
          Math.abs(remaining) < 0.5
            ? targetAscent.current
            : ascent.current + remaining * (1 - Math.exp(-elapsed / 90));
        draw(paused ? 4 : Math.floor(now / (1000 / 12)) / 12);
        last = now;
      }
      frame =
        !motion.matches && (!paused || ascent.current !== targetAscent.current)
          ? requestAnimationFrame(tick)
          : 0;
    };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTick = 0;
      if (motion.matches) ascent.current = targetAscent.current;
      draw(4);
      if (
        !motion.matches &&
        (!paused || ascent.current !== targetAscent.current)
      ) {
        frame = requestAnimationFrame(tick);
      }
    };
    const move = (delta: number) => {
      targetAscent.current = Math.max(
        0,
        Math.min(500, targetAscent.current + delta),
      );
      if (motion.matches) {
        ascent.current = targetAscent.current;
        draw(4);
      } else if (!frame) {
        frame = requestAnimationFrame(tick);
      }
    };
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || !event.deltaY) return;
      event.preventDefault();
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? canvas.clientHeight
            : 1;
      move(-event.deltaY * unit * 0.35);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      event.preventDefault();
      move(event.key === "ArrowUp" ? 60 : -60);
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("keydown", onKeyDown);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(canvas);
    motion.addEventListener("change", update);
    update();
    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("keydown", onKeyDown);
      observer.disconnect();
      motion.removeEventListener("change", update);
    };
  }, [loading, paused, resolvedTheme]);

  return (
    <div ref={columnRef} className="relative h-dvh min-w-0 lg:static lg:h-auto">
      <div
        ref={panelRef}
        className="group/alley absolute inset-0 overflow-hidden lg:left-1/2 lg:rounded-r-lg"
      >
        {loading ? (
          <Skeleton className="size-full rounded-none" />
        ) : (
          <>
            <canvas
              ref={canvasRef}
              role="img"
              tabIndex={0}
              aria-label="Interactive pixel city beneath a fixed half moon. Scroll up or press Arrow Up to rise to the rooftops; scroll down or press Arrow Down to descend."
              className="pixelated absolute inset-0 size-full text-primary outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-4 bottom-4 opacity-0 transition-opacity group-hover/alley:opacity-100 focus-visible:opacity-100 motion-reduce:hidden"
              aria-label={
                paused ? "Play skyline animation" : "Pause skyline animation"
              }
              aria-pressed={paused}
              onClick={() => setPaused(!paused)}
            >
              <AppIcon icon={paused ? PlayIcon : PauseIcon} />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
