// ==========================================
// NEW PIXEL ART ENGINE (Advanced 3-Frame Animations)
// ==========================================
window.PALETTE = {
  '0': 'transparent',
  '1': '#191516', // Outline / Deep shadow
  '2': '#ffcdb1', // Skin
  '3': '#2b1d29', // Hair / Cloak dark
  '4': '#ffae00', // Eye bright golden
  '5': '#cc4400', // Eye dark orange/red
  '6': '#2d3748', // Inner clothes
  '7': '#e67e22', // Orange straps/accents
  '8': '#ffffff', // Eye glint
  '9': '#4a4b65', // Highlight inner clothes
  'A': '#3e2723'  // Shoes
};

function createEmptyGrid() {
  return Array(32).fill("0".repeat(32));
}

function drawRect(grid, x, y, w, h, col) {
  for (let i = y; i < y + h; i++) {
    if (i >= 0 && i < 32) {
      let row = grid[i].split('');
      for (let j = x; j < x + w; j++) {
        if (j >= 0 && j < 32) row[j] = col;
      }
      grid[i] = row.join('');
    }
  }
}

// Builds a single frame based on state parameters
function buildMascotGrid(face, body, arms, frame) {
    let grid = createEmptyGrid();
    
    let yO = 0; // Vertical bounce offset
    if (body === 'idle') {
        yO = (frame === 1) ? 1 : 0; // Breath bounce
    } else if (body === 'walk') {
        yO = (frame === 1) ? -1 : 0; // Skip bounce
    } else if (body === 'climb') {
        yO = (frame % 2 === 0) ? -1 : 0;
    } else if (body === 'sit') {
        yO = 2; // Squat down
    }

    // ================= BODY & CAPE =================
    // Cape back
    drawRect(grid, 9, 16 + yO, 14, 12, '3'); 
    
    // Legs
    if (body === 'walk') {
        if (frame === 0) {
            drawRect(grid, 12, 28 + yO, 3, 3, 'A');
            drawRect(grid, 17, 28 + yO, 3, 3, 'A');
        } else if (frame === 1) {
            drawRect(grid, 12, 27 + yO, 3, 3, 'A'); // L foot up
            drawRect(grid, 17, 28 + yO, 3, 3, 'A');
        } else {
            drawRect(grid, 12, 28 + yO, 3, 3, 'A'); 
            drawRect(grid, 17, 27 + yO, 3, 3, 'A'); // R foot up
        }
    } else if (body === 'sit') {
        drawRect(grid, 9, 27 + yO, 6, 3, 'A'); // Spread legs
        drawRect(grid, 17, 27 + yO, 6, 3, 'A');
    } else { 
        // Idle / Default
        drawRect(grid, 12, 28 + yO, 3, 3, 'A');
        drawRect(grid, 17, 28 + yO, 3, 3, 'A');
    }

    // Body Inner (Dark clothes)
    drawRect(grid, 11, 16 + yO, 10, 11, '6');
    drawRect(grid, 12, 17 + yO, 8, 9, '9'); // belly highlight
    
    // Orange straps on chest
    drawRect(grid, 11, 16 + yO, 2, 4, '7');
    drawRect(grid, 19, 16 + yO, 2, 4, '7');

    // Arms / Cape Sleeves
    if (arms === 'idle' || arms === 'walk') {
        drawRect(grid, 7, 16 + yO, 4, 10, '3'); // L sleeve
        drawRect(grid, 21, 16 + yO, 4, 10, '3'); // R sleeve
    } else if (arms === 'up') {
        drawRect(grid, 7, 11 + yO, 4, 9, '3');
        drawRect(grid, 21, 11 + yO, 4, 9, '3');
    } else if (arms === 'crossed') {
        drawRect(grid, 9, 20 + yO, 14, 4, '3'); 
    }

    // ================= HEAD & HAIR =================
    // Hair back volume
    drawRect(grid, 8, 3 + yO, 16, 14, '3');
    // Spikey hair extensions
    drawRect(grid, 6, 5 + yO, 3, 3, '3');
    drawRect(grid, 5, 9 + yO, 4, 2, '3');
    drawRect(grid, 23, 6 + yO, 3, 3, '3');
    drawRect(grid, 24, 10 + yO, 3, 2, '3');
    drawRect(grid, 12, 1 + yO, 3, 3, '3');
    drawRect(grid, 16, 2 + yO, 3, 3, '3');
    // Main face skin
    drawRect(grid, 10, 8 + yO, 12, 9, '2');

    // ================= FACE =================
    if (face === 'idle' || face === 'walk') {
        // Golden eyes
        drawRect(grid, 11, 11 + yO, 3, 3, '5'); // Outline dark red
        drawRect(grid, 12, 12 + yO, 2, 2, '4'); // Inner gold
        drawRect(grid, 18, 11 + yO, 3, 3, '5');
        drawRect(grid, 18, 12 + yO, 2, 2, '4');
        drawRect(grid, 11, 11 + yO, 1, 1, '8'); // Glint
        drawRect(grid, 18, 11 + yO, 1, 1, '8'); 
        
        if (face === 'idle') drawRect(grid, 14, 15 + yO, 4, 1, '1'); // mouth
    } else if (face === 'angry') {
        drawRect(grid, 11, 11 + yO, 3, 3, '5');
        drawRect(grid, 12, 12 + yO, 2, 2, '4');
        drawRect(grid, 18, 11 + yO, 3, 3, '5');
        drawRect(grid, 18, 12 + yO, 2, 2, '4');
        // Angry brows
        drawRect(grid, 10, 10 + yO, 4, 1, '1');
        drawRect(grid, 18, 10 + yO, 4, 1, '1');
        // Mouth shouting
        drawRect(grid, 14, 14 + yO, 4, 3, '5'); 
        drawRect(grid, 15, 15 + yO, 2, 1, '8'); // teeth
    } else if (face === 'sleepy') {
        // Eyes closed horizontally
        drawRect(grid, 11, 12 + yO, 3, 1, '1');
        drawRect(grid, 18, 12 + yO, 3, 1, '1');
        drawRect(grid, 15, 14 + yO, 2, 2, '5');
    } else if (face === 'shock') {
        // Wide eyes
        drawRect(grid, 11, 10 + yO, 3, 5, '5');
        drawRect(grid, 12, 11 + yO, 2, 4, '4');
        drawRect(grid, 18, 10 + yO, 3, 5, '5');
        drawRect(grid, 18, 11 + yO, 2, 4, '4');
        drawRect(grid, 14, 15 + yO, 4, 2, '1');
    }

    return grid;
}

// Each state now has an array of 3 frames to loop through!
window.SPRITES = {
  // format:   [ buildMascotGrid(face, body, arms, frame) x 3 ]
  'idle': [
      buildMascotGrid('idle', 'idle', 'idle', 0),
      buildMascotGrid('idle', 'idle', 'idle', 1),
      buildMascotGrid('idle', 'idle', 'idle', 2)
  ],
  '*chay_loan*': [
      buildMascotGrid('idle', 'walk', 'walk', 0),
      buildMascotGrid('idle', 'walk', 'walk', 1),
      buildMascotGrid('idle', 'walk', 'walk', 2)
  ],
  '*leo_treo*': [
      buildMascotGrid('angry', 'climb', 'up', 0),
      buildMascotGrid('angry', 'climb', 'up', 1),
      buildMascotGrid('angry', 'climb', 'up', 2)
  ],
  '*roi_xuong*': [
      buildMascotGrid('shock', 'idle', 'up', 0),
      buildMascotGrid('shock', 'idle', 'up', 1),
      buildMascotGrid('shock', 'idle', 'up', 2)
  ],
  '*tiep_dat*': [
      buildMascotGrid('angry', 'sit', 'idle', 0),
      buildMascotGrid('angry', 'sit', 'idle', 1),
      buildMascotGrid('angry', 'sit', 'idle', 2)
  ],
  '*ngoi_xom*': [
      buildMascotGrid('sleepy', 'sit', 'idle', 0),
      buildMascotGrid('sleepy', 'sit', 'idle', 1),
      buildMascotGrid('sleepy', 'sit', 'idle', 2)
  ],
  '*giat_minh*': [
      buildMascotGrid('shock', 'idle', 'idle', 0),
      buildMascotGrid('shock', 'idle', 'up', 1),
      buildMascotGrid('shock', 'idle', 'idle', 2)
  ],
  '*khoanh_tay*': [
      buildMascotGrid('angry', 'idle', 'crossed', 0),
      buildMascotGrid('angry', 'idle', 'crossed', 1),
      buildMascotGrid('angry', 'idle', 'crossed', 2)
  ]
};

// Aliases for missing states pointing to existing ones:
window.SPRITES['*bi_nhac_len*'] = window.SPRITES['*roi_xuong*'];
window.SPRITES['*do_mat*'] = window.SPRITES['*khoanh_tay*'];
window.SPRITES['*keo_tha*'] = window.SPRITES['*chay_loan*'];
window.SPRITES['*tuc_gian*'] = window.SPRITES['*khoanh_tay*'];
window.SPRITES['*ngap_ngu*'] = window.SPRITES['*ngoi_xom*'];
window.SPRITES['*chi_tay*'] = window.SPRITES['*khoanh_tay*'];
window.SPRITES['*quay_di*'] = window.SPRITES['*khoanh_tay*'];
window.SPRITES['*che_mat*'] = window.SPRITES['*khoanh_tay*'];
