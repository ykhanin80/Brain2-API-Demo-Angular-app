export type TextAlign = 'left' | 'right' | 'center';

export interface OverlayPosition {
  x: number;
  y: number;
  width?: number;
  align?: TextAlign;
}

export interface NutritionOverlayMapEntry {
  baseWidth: number;
  baseHeight: number;
  image: string; // path under public/
  positions: Record<number, OverlayPosition>;
}

// Only the 'standard' layout is kept. If more layouts are reintroduced, extend this union accordingly.
export type NutritionOverlayMaps = Record<'standard', NutritionOverlayMapEntry>;

export const NUTRITION_OVERLAY_MAPS: NutritionOverlayMaps = {
  standard: {
    baseWidth: 680,
    baseHeight: 947,
    image: 'labels/nutrition-dual.png',
    positions: {
      1:{x:600,y:82,width:60}, 
      2:{x:206,y:60,width:60},
      3:{x:478,y:160,width:60},
      4:{x:620,y:160,width:60}, 
      5:{x:424,y:224,width:60},               27:{x:568,y:224,width:60},
      6:{x:498,y:224,width:60,align:'right'}, 28:{x:635,y:224,width:60,align:'right'}, 
      7:{x:424,y:248,width:60},               29:{x:568,y:248,width:60},
      8:{x:498,y:248,width:60,align:'right'}, 30:{x:635,y:248,width:60,align:'right'},
      9:{x:424,y:274,width:70},              10:{x:568,y:274,width:60,align:'right'},
      11:{x:424,y:300,width:60},              31:{x:568,y:300,width:60},
      12:{x:498,y:300,width:60,align:'right'}, 32:{x:635,y:300,width:60,align:'right'},
      13:{x:424,y:325,width:60},              33:{x:568,y:325,width:60},
      14:{x:498,y:325,width:60,align:'right'}, 34:{x:635,y:325,width:60,align:'right'},
      15:{x:424,y:350,width:60},              35:{x:568,y:350,width:60},
      16:{x:498,y:350,width:60,align:'right'}, 36:{x:635,y:350,width:60,align:'right'},
      17:{x:424,y:375,width:60},              37:{x:568,y:375,width:60},
      18:{x:498,y:375,width:60,align:'right'}, 38:{x:635,y:375,width:60,align:'right'},
      19:{x:424,y:401,width:60},              39:{x:568,y:401,width:60},
      20:{x:424,y:427,width:60,align:'right'}, 40:{x:568,y:427,width:60,align:'right'},
      21:{x:498,y:427,width:60},              41:{x:635,y:427,width:60},
      22:{x:424,y:451,width:60,align:'right'}, 42:{x:568,y:451,width:60,align:'right'},
      23:{x:424,y:492,width:130}, 43:{x:568,y:492,width:120},
      24:{x:424,y:517,width:130}, 44:{x:568,y:517,width:120},
      25:{x:424,y:543,width:130}, 45:{x:568,y:543,width:120},
      26:{x:424,y:567,width:130}, 46:{x:568,y:567,width:120},
      47:{x:150,y:475,width:60},
      48:{x:150,y:500,width:60},
      49:{x:150,y:525,width:60}, 
      50:{x:150,y:550,width:60}
    }
  }
  
  }
