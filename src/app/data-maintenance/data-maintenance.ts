
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevicesComponent } from './devices/devices';
import { ExceptionsComponent } from './exceptions/exceptions';
import { StaticTextsListComponent } from './static-texts/static-texts-list';
import { DeviceParametersComponent } from './device-parameters/device-parameters';
import { ArticlesTableComponent } from './articles/articles-table';
import { DebugPanelComponent } from './debug/debug-panel';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../auth';
import { ApiConfig } from '../api-config';
// PapaParse will be lazy-loaded only when an import file is selected to avoid SSR/runtime issues.
let PapaRef: any = null;
import { parseCsvFile, autoMapHeaders, enforceUniqueMapping, downloadCsv, trimValue, parseNumberValue, parseBoolValue, runConcurrentQueue } from '../shared/csv-import.util';
import { NUTRITION_OVERLAY_MAPS, NutritionOverlayMaps } from './overlay/overlay-maps';

// Static Texts data structures
interface StaticTextItem {
  number: number;
  textValue: string;
  sendFormat: boolean;
  fontClass?: string; // 'overlay-text-bold' | 'overlay-text-regular'
}

interface StaticTextData {
  number: number;
  description: string;
  items: StaticTextItem[];
}

export interface TextField {
  number: number;
  text: string | null;
}

export interface IngredientsProportion {
  value: number;
  decimalPlaces: number;
  unit: string;
}

export interface ArticlePLU {
  // Date Text Fields
  dateTextField1: TextField;
  dateTextField2: TextField;
  dateTextField3: TextField;
  
  // Text Fields (1-20)
  textField1: TextField;
  textField2: TextField;
  textField3: TextField;
  textField4: TextField;
  textField5: TextField;
  textField6: TextField;
  textField7: TextField;
  textField8: TextField;
  textField9: TextField;
  textField10: TextField;
  textField11: TextField;
  textField12: TextField;
  textField13: TextField;
  textField14: TextField;
  textField15: TextField;
  textField16: TextField;
  textField17: TextField;
  textField18: TextField;
  textField19: TextField;
  textField20: TextField;
  
  // Logo Fields (1-10)
  logoField1: number;
  logoField2: number;
  logoField3: number;
  logoField4: number;
  logoField5: number;
  logoField6: number;
  logoField7: number;
  logoField8: number;
  logoField9: number;
  logoField10: number;
  
  // Code Fields (1-7)
  codeField1: number;
  codeField2: number;
  codeField3: number;
  codeField4: number;
  codeField5: number;
  codeField6: number;
  codeField7: number;
  
  // Code Strings (1-7)
  codeString1: string;
  codeString2: string;
  codeString3: string;
  codeString4: string;
  codeString5: string;
  codeString6: string;
  codeString7: string;
  
  // General Numbers (1-20)
  generalNumber1: number;
  generalNumber2: number;
  generalNumber3: number;
  generalNumber4: number;
  generalNumber5: number;
  generalNumber6: number;
  generalNumber7: number;
  generalNumber8: number;
  generalNumber9: number;
  generalNumber10: number;
  generalNumber11: number;
  generalNumber12: number;
  generalNumber13: number;
  generalNumber14: number;
  generalNumber15: number;
  generalNumber16: number;
  generalNumber17: number;
  generalNumber18: number;
  generalNumber19: number;
  generalNumber20: number;
  
  // Simple Texts (1-30)
  simpleText1: string;
  simpleText2: string;
  simpleText3: string;
  simpleText4: string;
  simpleText5: string;
  simpleText6: string;
  simpleText7: string;
  simpleText8: string;
  simpleText9: string;
  simpleText10: string;
  simpleText11: string;
  simpleText12: string;
  simpleText13: string;
  simpleText14: string;
  simpleText15: string;
  simpleText16: string;
  simpleText17: string;
  simpleText18: string;
  simpleText19: string;
  simpleText20: string;
  simpleText21: string;
  simpleText22: string;
  simpleText23: string;
  simpleText24: string;
  simpleText25: string;
  simpleText26: string;
  simpleText27: string;
  simpleText28: string;
  simpleText29: string;
  simpleText30: string;
  
  // Total Preselected Values
  total1PreselectedValueForPiece: number;
  total2PreselectedValueForPiece: number;
  total3PreselectedValueForPiece: number;
  
  // Print Channel Configurations
  printChannelInternalConfiguration: string;
  printChannelAConfiguration: string;
  printChannelBConfiguration: string;
  printChannelCConfiguration: string;
  printChannelDConfiguration: string;
  printChannelEConfiguration: string;
  printChannelFConfiguration: string;
  printChannelGConfiguration: string;
  printChannelHConfiguration: string;
  printChannelIConfiguration: string;
  printChannelJConfiguration: string;
  printChannelKConfiguration: string;
  
  // Pricing
  unitPriceValue: number;
  basePriceDivision: string;
  specialUnitPriceValue: number;
  recalculateUnitPriceType: string;
  
  // Shelf Life
  shelfLifeDays1: number;
  shelfLifeDays2: number;
  
  // Dates and Times
  date1: string;
  date2: string;
  date3: string;
  time1PrintConfiguration: string;
  time2PrintConfiguration: string;
  
  // Weights
  tareWeightValue: number;
  fixedWeightValue: number;
  minWeightValue: number;
  maxWeightValue: number;
  
  // Scanner and Rules
  scannerCompulsory: string;
  scanningRule: number;
  labelScanningRule: number;
  productGroupNumber: number;
  tendencyControl: number;
  
  // Labeling
  staticText: number;
  automaticLabelParameter: number;
  labelParameter: number;
  piecesPerPackage: number;
  numberOfSuccessiveLabels: number;
  numberOfLabelCopies: number;
  labelingMode: string;
  ingredientsProportion: IngredientsProportion;
  alternateLabelDataOutputChannel: string;
  alternateLabelCriteria: string;
  labelLanguage: number;
  
  // Currency and Conversion
  countrySecondCurrency: string;
  printConversionRate: string;
  
  // Template and Classes
  template: number;
  weightClass: number;
  
  // Package Properties
  heightOfPackage: number;
  packageLength: number;
  packageLengthTolerance: number;
  
  // Product Numbers
  metalDetectorProductNumber: string;
  productNumberLDI: number;
  productNumberLCE: number;
  
  // Configuration
  codepage: string;
  macroModeT: string;
  
  // Flags
  nutritionLabelEnabled: boolean;
  locationsEnabled: boolean;
  tendencyRegulationEnabled: boolean;
  
  // Preselection
  preselectionTotal: any;
}

export interface LabelerArticle {
  // General Article Information
  name: string;
  description: string;
  number: string;
  active: boolean;
  approved: boolean;
  additional1: string;
  additional2: string;
  commonText1: string;
  commonText2: string;
  commonNumber1: number;
  commonNumber2: number;
  
  // Labeler Configuration
  isEnabledForLabelers: boolean;
  weightUnit: string;
  weightDecimalPlaces: number;
  articlePLU: ArticlePLU;
  
  // GX Checkweigher Configuration
  isEnabledForGxCheckWeighers: boolean;
  gxPriceCurrencyCode: string;
  gxPriceDecimalPlaces: number;
}

export interface ArticleSearchParams {
  skip?: number;
  take?: number;
  sort?: string;
  articleName?: string;
  articleNumber?: string;
}

@Component({
  selector: 'data-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, DevicesComponent, ExceptionsComponent, StaticTextsListComponent, ArticlesTableComponent, DebugPanelComponent, DeviceParametersComponent],
  templateUrl: './data-maintenance.html',
  styleUrls: ['./data-maintenance.scss']
})
export class DataMaintenanceComponent implements OnInit {
  // Auth-specific UI elements are handled in the app header; no token countdown here
  isAuthenticated = () => this.auth.isAuthenticated();
  // Save overlay field positions to persist user changes
  saveOverlayPositions() {
    const map = this.getCurrentNutritionMap();
    // Overwrite the nutritionOverlayMaps entry with current positions
    this.nutritionOverlayMaps[this.labelLayout()].positions = { ...map.positions };
    this.apiResponse.set({ type: 'success', message: 'Overlay positions saved to code map', timestamp: new Date().toISOString() });
  }
  // Drag/resize state
  private dragItem: number|null = null;
  private dragStart = { x: 0, y: 0 };
  private dragOrig = { x: 0, y: 0 };
  private resizeItem: number|null = null;
  private resizeStartX = 0;
  private resizeOrigWidth = 0;

  startDrag(ev: MouseEvent|TouchEvent, itemNumber: number) {
    ev.preventDefault();
    this.dragItem = itemNumber;
    const pos = this.getOverlayPosition(itemNumber);
    if (!pos) return;
    if (ev instanceof MouseEvent) {
      this.dragStart = { x: ev.clientX, y: ev.clientY };
    } else {
      this.dragStart = { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
    }
    this.dragOrig = { x: pos.x, y: pos.y };
    window.addEventListener('mousemove', this.onDragMove);
    window.addEventListener('mouseup', this.endDrag);
    window.addEventListener('touchmove', this.onDragMove);
    window.addEventListener('touchend', this.endDrag);
  }

  onDragMove = (ev: MouseEvent|TouchEvent) => {
    if (this.dragItem == null) return;
    let dx, dy;
    if (ev instanceof MouseEvent) {
      dx = ev.clientX - this.dragStart.x;
      dy = ev.clientY - this.dragStart.y;
    } else {
      dx = ev.touches[0].clientX - this.dragStart.x;
      dy = ev.touches[0].clientY - this.dragStart.y;
    }
    const map = this.getCurrentNutritionMap();
    const scaleX = map.baseWidth / (document.querySelector('.nutrition-overlay-canvas')?.clientWidth || map.baseWidth);
    const scaleY = map.baseHeight / (document.querySelector('.nutrition-overlay-canvas')?.clientHeight || map.baseHeight);
    const pos = this.getOverlayPosition(this.dragItem);
    if (!pos) return;
    pos.x = Math.max(0, Math.min(map.baseWidth, this.dragOrig.x + dx * scaleX));
    pos.y = Math.max(0, Math.min(map.baseHeight, this.dragOrig.y + dy * scaleY));
    this.forceUpdateOverlay();
  };

  endDrag = () => {
    this.dragItem = null;
    window.removeEventListener('mousemove', this.onDragMove);
    window.removeEventListener('mouseup', this.endDrag);
    window.removeEventListener('touchmove', this.onDragMove);
    window.removeEventListener('touchend', this.endDrag);
  };

  startResize(ev: MouseEvent|TouchEvent, itemNumber: number) {
    ev.preventDefault();
    this.resizeItem = itemNumber;
    const pos = this.getOverlayPosition(itemNumber);
    if (!pos) return;
    if (ev instanceof MouseEvent) {
      this.resizeStartX = ev.clientX;
    } else {
      this.resizeStartX = ev.touches[0].clientX;
    }
    this.resizeOrigWidth = pos.width || 80;
    window.addEventListener('mousemove', this.onResizeMove);
    window.addEventListener('mouseup', this.endResize);
    window.addEventListener('touchmove', this.onResizeMove);
    window.addEventListener('touchend', this.endResize);
  }

  onResizeMove = (ev: MouseEvent|TouchEvent) => {
    if (this.resizeItem == null) return;
    let dx;
    if (ev instanceof MouseEvent) {
      dx = ev.clientX - this.resizeStartX;
    } else {
      dx = ev.touches[0].clientX - this.resizeStartX;
    }
    const map = this.getCurrentNutritionMap();
    const scaleX = map.baseWidth / (document.querySelector('.nutrition-overlay-canvas')?.clientWidth || map.baseWidth);
    const pos = this.getOverlayPosition(this.resizeItem);
    if (!pos) return;
    pos.width = Math.max(20, Math.min(map.baseWidth, this.resizeOrigWidth + dx * scaleX));
    this.forceUpdateOverlay();
  };

  endResize = () => {
    this.resizeItem = null;
    window.removeEventListener('mousemove', this.onResizeMove);
    window.removeEventListener('mouseup', this.endResize);
    window.removeEventListener('touchmove', this.onResizeMove);
    window.removeEventListener('touchend', this.endResize);
  };

  forceUpdateOverlay() {
    // Triggers Angular change detection for overlay
    this.labelLayout.set(this.labelLayout());
  }
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  private readonly apiConfig = inject(ApiConfig);

  // Dark mode detection
  readonly isDarkMode = signal(false);

  // State signals
  articles = signal<LabelerArticle[]>([]);
  get articleOptions(){ return (this.articles()||[]).map(a=>({ number: a.number, name: a.name })); }
  selectedArticle = signal<LabelerArticle | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  // Form controls
  searchParams = signal<ArticleSearchParams>({
    skip: 0,
    take: 10,
    sort: 'Number+',
    articleName: '',
    articleNumber: ''
  });

  // Legacy modal states (delete & confirmation retained)
  showDeleteConfirm = signal(false);

  // View states for full page navigation
  currentView = signal<'list' | 'create' | 'edit' | 'copy'>('list');
  // Sub-page: articles, static-texts, customers, devices, exceptions, device-parameters (default articles)
  currentSubPage = signal<'articles' | 'static-texts' | 'customers' | 'devices' | 'exceptions' | 'device-parameters'>('articles');

  // Raw text buffer for edit/copy inputs to avoid caret/value reset on each signal update
  rawEditFields: { [key: string]: string | undefined } = {};
  // Raw buffers for dynamic text inputs on Edit view
  rawSimpleTextsEdit: { [key: string]: string | undefined } = {};
  rawTextFieldTextsEdit: { [key: string]: string | undefined } = {};
  // Raw text buffer for create view general inputs
  rawNewArticleFields: { [key: string]: string | undefined } = {};
  // Raw buffers for dynamic text inputs on Create view (Text Field text properties)
  rawTextFieldTextsCreate: { [key: string]: string | undefined } = {};

  onEditFieldInput(fieldKey: 'name' | 'description' | 'number', event: Event) {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.rawEditFields[fieldKey] = value;
    this.updateSelectedArticleField(fieldKey as any, event);
  }

  onEditFieldBlur(fieldKey: 'name' | 'description' | 'number') {
    // Clear buffer so model drives value
    delete this.rawEditFields[fieldKey];
  }

  // Buffered typing for Text Fields (text property) in Edit view
  onEditTextFieldTextInput(fieldKey: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.rawTextFieldTextsEdit[fieldKey] = value;
    this.updateSelectedArticleTextFieldDynamic(fieldKey, 'text', event);
  }
  onEditTextFieldTextBlur(fieldKey: string) {
    delete this.rawTextFieldTextsEdit[fieldKey];
  }

  // Buffered typing for Simple Texts in Edit view
  onEditSimpleTextInput(fieldKey: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.rawSimpleTextsEdit[fieldKey] = value;
    this.updateSelectedArticlePLUFieldDynamic(fieldKey, event);
  }
  onEditSimpleTextBlur(fieldKey: string) {
    delete this.rawSimpleTextsEdit[fieldKey];
  }

  // Create view: buffered typing for general fields
  onCreateFieldInput(fieldKey: 'number' | 'name' | 'description', event: Event) {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.rawNewArticleFields[fieldKey] = value;
    this.updateNewArticleField(fieldKey as any, event);
  }
  onCreateFieldBlur(fieldKey: 'number' | 'name' | 'description') {
    delete this.rawNewArticleFields[fieldKey];
  }

  // Create view: buffered typing for Text Field text properties
  onCreateTextFieldTextInput(fieldKey: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.rawTextFieldTextsCreate[fieldKey] = value;
    this.updateNewArticleTextField(fieldKey as any, 'text', event);
  }
  onCreateTextFieldTextBlur(fieldKey: string) {
    delete this.rawTextFieldTextsCreate[fieldKey];
  }

  // trackBy helpers to prevent DOM recreation on every keystroke
  trackByTextField = (index: number, item: { key: string; index: number }) => item.key;
  trackBySimpleText = (index: number, item: { key: string; index: number }) => item.key;

  // Static Text form state
  staticTextData = signal<StaticTextData>({
  number: 1001,
  description: '',
  items: Array.from({length:50},(_,i)=>({number:i+1,textValue:'',sendFormat:false,fontClass: (i%2===0 ? 'overlay-text-bold' : 'overlay-text-regular')}))
  });
  staticTextDirty = signal(false);
  isStaticTextDirty(){ return this.staticTextDirty(); }
  // Nutrition label layout selection (only 'standard' supported now)
  labelLayout = signal<'standard'>('standard');
  setLabelLayout(ev: Event){
    const v = (ev.target as HTMLSelectElement).value as any;
    if(v==='standard') this.labelLayout.set(v);
  }
  // Coordinate map for overlay inputs moved to overlay-maps.ts
  private nutritionOverlayMaps: NutritionOverlayMaps = NUTRITION_OVERLAY_MAPS;
  getCurrentNutritionMap(){ return this.nutritionOverlayMaps[this.labelLayout()]; }
  getOverlayPosition(itemNumber: number){
    const map = this.getCurrentNutritionMap();
    const pos = map.positions[itemNumber];
    return pos;
  }
  // Compute effective overlay width with a sensible default when width isn't provided
  getOverlayWidth(itemNumber: number){
    const pos = this.getOverlayPosition(itemNumber);
    return pos?.width ?? 80;
  }
  
  // API response feedback
  apiResponse = signal<{
    type: 'success' | 'error' | null;
    message: string;
    timestamp?: string;
  }>({ type: null, message: '' });

  // Helper function to create empty ArticlePLU
  private createEmptyArticlePLU(): ArticlePLU {
    return {
      // Date Text Fields
      dateTextField1: { number: -1, text: null },
      dateTextField2: { number: -1, text: null },
      dateTextField3: { number: -1, text: null },
      
      // Text Fields (1-20)
      textField1: { number: -1, text: null },
      textField2: { number: -1, text: null },
      textField3: { number: -1, text: null },
      textField4: { number: -1, text: null },
      textField5: { number: -1, text: null },
      textField6: { number: -1, text: null },
      textField7: { number: -1, text: null },
      textField8: { number: -1, text: null },
      textField9: { number: -1, text: null },
      textField10: { number: -1, text: null },
      textField11: { number: -1, text: null },
      textField12: { number: -1, text: null },
      textField13: { number: 0, text: null },
      textField14: { number: 0, text: null },
      textField15: { number: 0, text: null },
      textField16: { number: 0, text: null },
      textField17: { number: 0, text: null },
      textField18: { number: 0, text: null },
      textField19: { number: 0, text: null },
      textField20: { number: 0, text: null },
      
      // Logo Fields (1-10)
      logoField1: 0, logoField2: 0, logoField3: 0, logoField4: 0, logoField5: 0,
      logoField6: 0, logoField7: 0, logoField8: 0, logoField9: 0, logoField10: 0,
      
      // Code Fields (1-7)
      codeField1: 0, codeField2: 0, codeField3: 0, codeField4: 0,
      codeField5: 0, codeField6: 0, codeField7: 0,
      
      // Code Strings (1-7)
      codeString1: '', codeString2: '', codeString3: '', codeString4: '',
      codeString5: '', codeString6: '', codeString7: '',
      
      // General Numbers (1-20)
      generalNumber1: 0, generalNumber2: 0, generalNumber3: 0, generalNumber4: 0, generalNumber5: 0,
      generalNumber6: 0, generalNumber7: 0, generalNumber8: 0, generalNumber9: 0, generalNumber10: 0,
      generalNumber11: 0, generalNumber12: 0, generalNumber13: 0, generalNumber14: 0, generalNumber15: 0,
      generalNumber16: 0, generalNumber17: 0, generalNumber18: 0, generalNumber19: 0, generalNumber20: 0,
      
      // Simple Texts (1-30)
      simpleText1: '', simpleText2: '', simpleText3: '', simpleText4: '', simpleText5: '',
      simpleText6: '', simpleText7: '', simpleText8: '', simpleText9: '', simpleText10: '',
      simpleText11: '', simpleText12: '', simpleText13: '', simpleText14: '', simpleText15: '',
      simpleText16: '', simpleText17: '', simpleText18: '', simpleText19: '', simpleText20: '',
      simpleText21: '', simpleText22: '', simpleText23: '', simpleText24: '', simpleText25: '',
      simpleText26: '', simpleText27: '', simpleText28: '', simpleText29: '', simpleText30: '',
      
      // Total Preselected Values
      total1PreselectedValueForPiece: 0,
      total2PreselectedValueForPiece: 0,
      total3PreselectedValueForPiece: 0,
      
      // Print Channel Configurations
      printChannelInternalConfiguration: 'alwaysActive',
      printChannelAConfiguration: 'alwaysActive',
      printChannelBConfiguration: 'alwaysActive',
      printChannelCConfiguration: 'alwaysActive',
      printChannelDConfiguration: 'alwaysActive',
      printChannelEConfiguration: 'alwaysActive',
      printChannelFConfiguration: 'alwaysActive',
      printChannelGConfiguration: 'alwaysActive',
      printChannelHConfiguration: 'alwaysActive',
      printChannelIConfiguration: 'alwaysActive',
      printChannelJConfiguration: 'alwaysActive',
      printChannelKConfiguration: 'alwaysActive',
      
      // Pricing
      unitPriceValue: 0,
      basePriceDivision: 'perUnit',
      specialUnitPriceValue: 0,
      recalculateUnitPriceType: 'withoutRecalculation',
      
      // Shelf Life
      shelfLifeDays1: 0,
      shelfLifeDays2: 0,
      
      // Dates and Times
      date1: 'noPrintout',
      date2: 'noPrintout',
      date3: 'noPrintout',
      time1PrintConfiguration: 'noPrintoutOfTime',
      time2PrintConfiguration: 'noPrintoutOfTime',
      
      // Weights
      tareWeightValue: 0,
      fixedWeightValue: 0,
      minWeightValue: 0,
      maxWeightValue: 0,
      
      // Scanner and Rules
      scannerCompulsory: 'notCompulsory',
      scanningRule: 0,
      labelScanningRule: 0,
      productGroupNumber: 0,
      tendencyControl: 0,
      
      // Labeling
      staticText: 0,
      automaticLabelParameter: 0,
      labelParameter: 0,
      piecesPerPackage: 0,
      numberOfSuccessiveLabels: 0,
      numberOfLabelCopies: 0,
      labelingMode: 'fixedWeight',
      ingredientsProportion: { value: 0, decimalPlaces: 0, unit: '%' },
      alternateLabelDataOutputChannel: 'internal',
      alternateLabelCriteria: 'withoutPrintOut',
      labelLanguage: 0,
      
      // Currency and Conversion
      countrySecondCurrency: 'dem',
      printConversionRate: 'without',
      
      // Template and Classes
      template: 0,
      weightClass: 0,
      
      // Package Properties
      heightOfPackage: 0,
      packageLength: 0,
      packageLengthTolerance: 0,
      
      // Product Numbers
      metalDetectorProductNumber: '0',
      productNumberLDI: 0,
      productNumberLCE: 0,
      
      // Configuration
      codepage: 'westernEurope',
      macroModeT: '',
      
      // Flags
      nutritionLabelEnabled: false,
      locationsEnabled: false,
      tendencyRegulationEnabled: false,
      
      // Preselection
      preselectionTotal: null
    };
  }

  // New article form
  newArticle = signal<Partial<LabelerArticle>>({
    // General Article Information
    name: '',
    description: '',
    number: '',
    active: true,
    approved: false,
    additional1: '',
    additional2: '',
    commonText1: '',
    commonText2: '',
    commonNumber1: 0,
    commonNumber2: 0,
    
    // Labeler Configuration
  isEnabledForLabelers: true,
  weightUnit: 'lb',
  weightDecimalPlaces: 2,
    
    // GX Checkweigher Configuration
    isEnabledForGxCheckWeighers: false,
    gxPriceCurrencyCode: 'USD',
    gxPriceDecimalPlaces: 2
  });

  // Debug functionality
  activeDebugTab = 'listArticles';
  jsonCollapsed = signal(true); // collapse debug panels by default
  debugApiResponses = {
    listArticles: null as any,
    getArticle: null as any,
    createArticle: null as any,
    createArticleResponse: null as any,
    updateArticle: null as any,
    updateArticleResponse: null as any,
  deleteArticle: null as any,
  // Customers (existing)
  createCustomer: null as any,
  // Static Texts
  stList: null as any,
  stCreateOrUpdate: null as any,
  // Devices
  devicesList: null as any,
  productionLinesList: null as any,
  // Exceptions
  exPut: null as any,
  // CSV Import (articles)
  csvImport: null as any,
  amparImport: null as any
  };

  private readonly allowedLabelingModes = ['weight','fixedPrice','fixedWeight','fixedValue'];

  // ---------------- Exceptions: State ----------------
  exceptions = {
    articleNumber: '',
    allCustomers: true,
    customerNumber: '',
    deviceSystemName: '',
    deviceSystemType: 'allDevices' as 'allDevices'|'device'|'deviceGroup',
    attributes: [] as Array<{ attribute: string; value: string }>,
    loading: false,
    error: null as string | null,
    response: null as any
  };
  attributeOptions: string[] = [
    'dateTextField1','dateTextField2','dateTextField3',
    ...Array.from({length:20},(_,i)=>`textField${i+1}`),
    ...Array.from({length:10},(_,i)=>`logoField${i+1}`),
    ...Array.from({length:7},(_,i)=>`codeField${i+1}`),
    ...Array.from({length:7},(_,i)=>`codeString${i+1}`),
    ...Array.from({length:20},(_,i)=>`generalNumber${i+1}`),
    ...Array.from({length:30},(_,i)=>`simpleText${i+1}`),
    'total1PreselectedValueForPiece','total2PreselectedValueForPiece','total3PreselectedValueForPiece',
    'printChannelInternalConfiguration',
    ...'ABCDEFGHIJK'.split('').map(s=>`printChannel${s}Configuration`),
    'unitPrice','basePriceDivision','specialUnitPrice','recalculateUnitPriceType',
    'shelfLifeDays1','shelfLifeDays2','date1','date2','date3','time1PrintConfiguration','time2PrintConfiguration',
    'tareWeight','tareNumber','fixedWeight','minWeight','maxWeight',
    'scannerCompulsory','scanningRule','labelScanningRule','productGroupNumber','tendencyControl','staticText',
    'automaticLabelParameter','labelParameter','piecesPerPackage','numberOfSuccessiveLabels','numberOfLabelCopies','labelingMode',
    'ingredientsProportion','alternateLabelDataOutputChannel','alternateLabelCriteria','labelLanguage','countrySecondCurrency','printConversionRate',
    'template','weightClass','metalDetectorProductNumber','productNumberLDI','productNumberLCE','codepage','macroModeT',
    'packageLength','packageLengthTolerance','articleText','packagesPerMinute',
    'preselectedTableTotal1Weight','preselectedTableTotal1Price','preselectedTableTotal1Pieces',
    'preselectedTableTotal2Weight','preselectedTableTotal2Price','preselectedTableTotal2Pieces','preselectedTableTotal2NumberOfTotal1'
  ];

  setExArticleNumber = (v: string) => { this.exceptions.articleNumber = v.trim(); };
  toggleExAllCustomers = () => { this.exceptions.allCustomers = !this.exceptions.allCustomers; if(this.exceptions.allCustomers){ this.exceptions.customerNumber=''; } };
  setExCustomerNumber = (v: string) => { this.exceptions.customerNumber = v.trim(); };
  setExDeviceSystemName = (v: string) => { this.exceptions.deviceSystemName = v; };
  setExDeviceSystemType = (v: string) => { if(v==='allDevices'||v==='device'||v==='deviceGroup') this.exceptions.deviceSystemType = v; };
  addExAttribute = () => { this.exceptions.attributes.push({ attribute: this.attributeOptions[0], value: '' }); };
  removeExAttribute = (i: number) => { this.exceptions.attributes.splice(i,1); };
  setExAttributeName = (i: number, v: string) => { this.exceptions.attributes[i].attribute = v; };
  setExAttributeValue = (i: number, v: string) => { this.exceptions.attributes[i].value = v; };

  // ---------------- Exceptions: CSV Import ----------------
  exImportState = signal<{open:boolean; step:'select'|'mapping'|'preview'|'running'|'done'}>({open:false, step:'select'});
  exImportHeaders = signal<string[]>([]);
  exImportMapping = signal<{[csvHeader:string]: string}>({});
  exImportRawRows = signal<any[]>([]);
  exImportRows = signal<any[]>([]);
  exImportProgress = signal<{processed:number; success:number; failed:number; percent:number; done:boolean}>({processed:0, success:0, failed:0, percent:0, done:false});
  private exImportCancelled = false;
  private exImportConcurrency = 3;
  private exImportFieldDefinitions: Array<{key:string; label:string; required?:boolean; synonyms:string[]}> = [
    { key:'articleNumber', label:'Article Number', required:true, synonyms:['article number','articlenumber','plu','number','article no','article_no','article'] },
    { key:'customerNumber', label:'Customer Number', required:false, synonyms:['customer number','customernumber','customer','customer no','customer_no'] },
    { key:'deviceSystemName', label:'Device System Name', required:false, synonyms:['device system name','devicesystemname','device name','devicename','device'] },
    { key:'deviceSystemType', label:'Device Type', required:false, synonyms:['device type','devicetype','type','device system type'] },
    { key:'attribute', label:'Attribute', required:true, synonyms:['attribute','attr'] },
    { key:'value', label:'Value', required:true, synonyms:['value','val'] }
  ];
  get exImportFieldDefs(){ return this.exImportFieldDefinitions; }
  exOpenImportDialog(){ this.exImportState.set({open:true, step:'select'}); this.exImportHeaders.set([]); this.exImportMapping.set({}); this.exImportRows.set([]); this.exImportRawRows.set([]); try{ document.body.classList.add('has-import-open'); }catch{} }
  exCloseImportDialog(){ if(this.exImportState().step==='running' && !this.exImportProgress().done){ this.exImportCancelled=true; } this.exImportState.set({open:false, step:'select'}); try{ document.body.classList.remove('has-import-open'); }catch{} }
  exDownloadImportTemplate(){
    const header = ['Article number','Customer number','Device System Name','device type','Attribute','value'];
    const rows = [
      ['15','', 'Top heads','deviceGroup','simpleText1','Fresh daily'],
      ['16','2', 'All','allDevices','labelingMode','fixedWeight']
    ];
    const esc=(s:any)=>{ const v=String(s??''); return /[",\n]/.test(v)? '"'+v.replace(/"/g,'""')+'"' : v; };
    const csv = [header.join(','), ...rows.map(r=>r.map(esc).join(','))].join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`Article-Exceptions-Template-${new Date().toISOString().substring(0,10)}.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  }
  async onExImportFileSelected(event: Event){
    const input = event.target as HTMLInputElement; const file = input.files && input.files[0]; if(!file) return;
    try {
      const { rawRows, headers } = await parseCsvFile(file, 5000);
      this.exImportRawRows.set(rawRows);
      this.exImportHeaders.set(headers);
      this.exAutoMapImportHeaders();
      this.exRebuildMappedRows();
      this.exImportState.set({open:true, step:'mapping'});
    } catch {
      this.error.set('Failed to parse CSV');
    }
  }
  exAutoMapImportHeaders(){
    const mapping = autoMapHeaders(this.exImportHeaders(), this.exImportFieldDefinitions, this.exImportMapping());
    this.exImportMapping.set(enforceUniqueMapping(mapping));
  }
  exUpdateImportMapping(csvHeader:string, target:string){ const m={...this.exImportMapping()}; if(!target) delete m[csvHeader]; else m[csvHeader]=target; const rev:any={}; for(const [h,t] of Object.entries(m)){ if(rev[t] && rev[t]!==h){ delete m[rev[t]]; } rev[t]=h; } this.exImportMapping.set(m); this.exRebuildMappedRows(); }
  private exRebuildMappedRows(){ const raw=this.exImportRawRows(); const rows=raw.map((r:any,i:number)=> this.exMapImportRow(r,i+2)); this.exImportRows.set(rows); }
  exRequiredImportFieldsMapped(){ const mapped=new Set(Object.values(this.exImportMapping())); return ['articleNumber','attribute','value'].every(k=> mapped.has(k)); }
  exGoToPreviewFromMapping(){ if(this.exRequiredImportFieldsMapped()) this.exImportState.set({open:true, step:'preview'}); }
  exBackToMapping(){ if(this.exImportState().step==='preview') this.exImportState.set({open:true, step:'mapping'}); }
  private exMapImportRow(r:any,line:number){
    const get=(k:string)=>{ const h=Object.entries(this.exImportMapping()).find(([,t])=>t===k)?.[0]; return h? r[h]:''; };
    const row:any = {
      original:r, line,
      articleNumber: trimValue(get('articleNumber')||r.articleNumber||r['Article number']),
      customerNumber: trimValue(get('customerNumber')||r.customerNumber||r['Customer number']),
      deviceSystemName: trimValue(get('deviceSystemName')||r.deviceSystemName||r['Device System Name']),
      deviceSystemType: (trimValue(
        get('deviceSystemType')||
        r.deviceSystemType||
        r['device type']||
        r['device type{allDevices,device,deviceGroup}']
      )||'allDevices') as 'allDevices'|'device'|'deviceGroup',
      attribute: trimValue(get('attribute')||r.attribute||r['Attribute']),
      value: trimValue(get('value')||r.value||r['value']),
      status:'', error:''
    };
    // Validate
    if(!row.articleNumber) row.error += 'missing articleNumber; ';
    const allowed = ['allDevices','device','deviceGroup'];
    if(row.deviceSystemType && !allowed.includes(row.deviceSystemType)) row.error += 'deviceType; ';
    if(!row.attribute) row.error += 'missing attribute; ';
    return row;
  }
  exInvalidImportRowCount(){ return this.exImportRows().filter(r=>r.error).length; }
  exStartImport(){
    this.exImportCancelled=false;
    this.exImportProgress.set({processed:0, success:0, failed:0, percent:0, done:false});
    const rows=this.exImportRows().filter(r=>!r.error);
    this.exImportRows.set(rows);
    this.exImportState.set({open:true, step:'running'});
    runConcurrentQueue(rows, (row)=> this.exProcessImportRow(row).then(()=> this.sleep(200)), {
      concurrency: 1,
      getCancelled: () => this.exImportCancelled,
      onItemDone: () => this.exUpdateImportProgress(),
      onDone: () => { /* handled in exUpdateImportProgress */ }
    });
  }
  exCancelImport(){ this.exImportCancelled=true; }
  private async exProcessImportRow(row:any){
    try{
      const payload:any = {
        articleNumber: row.articleNumber,
        state: 'active',
        deviceSystem: { name: row.deviceSystemName || 'All', type: row.deviceSystemType || 'allDevices' },
        attributes: [{ attribute: row.attribute, value: row.value }]
      };
      if(row.customerNumber) payload.customerNumber = row.customerNumber;
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}`, 'Content-Type':'application/json' });
      const url = `${this.apiConfig.getBaseUrl()}/api/v1/article-exceptions/articleNumber/${encodeURIComponent(row.articleNumber)}`;
      await this.http.put(url, payload, { headers }).toPromise();
      row.status='created';
    }catch(e:any){ row.status='failed'; row.error = e?.error?.title || e?.message || 'error'; }
  }
  private exUpdateImportProgress(){ const rows=this.exImportRows(); const processed=rows.filter(r=>r.status).length; const success=rows.filter(r=>r.status==='created').length; const failed=rows.filter(r=>r.status==='failed').length; const percent=rows.length? Math.round(processed*100/rows.length):0; const done=processed===rows.length || this.exImportCancelled; this.exImportProgress.set({processed, success, failed, percent, done}); if(done) this.exFinishImport(); }
  private exFinishImport(){ this.exImportState.set({open:true, step:'done'}); }
  exDownloadImportErrors(){ const errs=this.exImportRows().filter(r=>r.status==='failed'); if(!errs.length) return; const header='line,articleNumber,attribute,error\n'; const body=errs.map(r=>`${r.line},"${(r.articleNumber||'').replace(/"/g,'""')}","${(r.attribute||'').replace(/"/g,'""')}","${(r.error||'').replace(/"/g,'""')}"`).join('\n'); const blob=new Blob([header+body],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='exceptions-import-errors.csv'; a.click(); URL.revokeObjectURL(url); }

  async putExceptions(){
    const articleNumber = this.exceptions.articleNumber.trim(); if(!articleNumber){ this.exceptions.error='Article number is required'; return; }
    if(!this.exceptions.allCustomers && !this.exceptions.customerNumber.trim()){
      this.exceptions.error = 'Customer number is required when All Customers is unchecked';
      return;
    }
    // Payload based on previous spec; sending articleNumber and exception fields via PUT
    const payload: any = {
      articleNumber,
      state: 'active',
      deviceSystem: { name: this.exceptions.deviceSystemName || 'All', type: this.exceptions.deviceSystemType },
      attributes: this.exceptions.attributes.map(a=>({ attribute: a.attribute, value: a.value }))
    };
    if(!this.exceptions.allCustomers){
      payload.customerNumber = this.exceptions.customerNumber.trim();
    }
    this.exceptions.loading = true; this.exceptions.error=null; this.exceptions.response=null;
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}`, 'Content-Type': 'application/json' });
  const requestUrl = `${this.apiConfig.getBaseUrl()}/api/v1/article-exceptions/articleNumber/${encodeURIComponent(articleNumber)}`;
    try{
      const res = await this.http.put(requestUrl, payload, { headers, observe: 'response' as const }).toPromise();
      // Build a richer response, especially for 204 No Content
      this.exceptions.response = {
        status: res?.status,
        statusText: res?.statusText,
        headers: {
          location: res?.headers?.get('Location') || null,
          contentType: res?.headers?.get('Content-Type') || null
        },
        body: res?.body ?? null,
        message: res?.status === 204 ? 'Exception saved (No Content).' : 'Exception saved.'
      };
      this.debugApiResponses.exPut = {
        timestamp: new Date().toISOString(), requestUrl,
        requestHeaders: { ...headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {}) },
        requestBody: payload, rawResponse: res
      };
    }catch(e:any){
      this.exceptions.error = e?.error?.title || e?.message || 'PUT failed';
  // Surface error payload into the Response panel for easier debugging
  this.exceptions.response = e?.error ?? { status: e?.status, message: e?.message, url: requestUrl };
      this.debugApiResponses.exPut = {
        timestamp: new Date().toISOString(), requestUrl,
        requestHeaders: { ...headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {}) },
        requestBody: payload, rawError: e
      };
    } finally { this.exceptions.loading = false; }
  }

  // Raw input buffers to preserve user typing (avoid premature numeric coercion)
  unitPriceInput = signal<string>('0');
  selectedUnitPriceInput = signal<string>('');
  // Buffered numeric inputs for textFieldX.number (create & edit)
  rawTextFieldNumbersCreate: { [key: string]: string } = {};
  rawTextFieldNumbersEdit: { [key: string]: string } = {};

  // Import feature state
  importState = signal<{open: boolean; step: 'select'|'mapping'|'preview'|'running'|'done'}>({open:false, step:'select'});
  importRows = signal<any[]>([]); // mapped rows with metadata
  importRawRows = signal<any[]>([]); // raw rows from CSV prior to mapping
  importHeaders = signal<string[]>([]); // original CSV headers
  importMapping = signal<{[csvHeader:string]: string}>({}); // header -> internal field key
  importProgress = signal<{processed:number; success:number; created:number; updated:number; failed:number; percent:number; done:boolean}>({processed:0, success:0, created:0, updated:0, failed:0, percent:0, done:false});
  private importFieldDefinitions: Array<{key:string; label:string; required?:boolean; synonyms:string[]}> = this.buildImportFieldDefinitions();
  private importRequiredKeys = ['number','name'];
  // Expose field definitions to template
  get importFieldDefs(){ return this.importFieldDefinitions; }

  // Static Texts import state (separate from Articles)
  stImportState = signal<{open: boolean; step: 'select'|'mapping'|'preview'|'running'|'done'}>({open:false, step:'select'});
  stImportRows = signal<any[]>([]);
  stImportRawRows = signal<any[]>([]);
  stImportHeaders = signal<string[]>([]);
  stImportMapping = signal<{[csvHeader:string]: string}>({});
  stImportProgress = signal<{processed:number; success:number; created:number; updated:number; failed:number; percent:number; done:boolean}>({processed:0, success:0, created:0, updated:0, failed:0, percent:0, done:false});
  private stImportFieldDefinitions: Array<{key:string; label:string; required?:boolean; synonyms:string[]}> = [
    { key:'number', label:'Static Text Number', required:true, synonyms:['number','no','statictextno','statictextnumber','stno'] },
    { key:'description', label:'Description', synonyms:['description','desc'] },
    // 50 text items
    ...Array.from({length:50},(_,i)=>({ key:`item${i+1}`, label:`Text ${i+1}`, synonyms:[`item${i+1}`,`text${i+1}`,`textvalue${i+1}`] }))
  ];
  private stImportRequiredKeys = ['number'];
  get stImportFieldDefs(){ return this.stImportFieldDefinitions; }

  // Static Texts import UI handlers
  stOpenImportDialog(){ this.stImportState.set({open:true, step:'select'}); this.stImportHeaders.set([]); this.stImportMapping.set({}); document.body.classList.add('has-import-open'); }
  stCloseImportDialog(){ if(this.stImportState().step==='running' && !this.stImportProgress().done){ this.stImportCancelled = true; } this.stImportState.set({open:false, step:'select'}); document.body.classList.remove('has-import-open'); }
  downloadStaticTextImportTemplate(){
    // Header per request: number,description,Text1..Text50
    const header = ['number','description', ...Array.from({length:50},(_,i)=>`Text${i+1}`)];
    // Five sample rows 1001..1005 with description suffix 01..05 and values "Text 1".."Text 50"
    const makeRow = (n:number) => [ String(1000+n), `Sample Static Text${String(n).padStart(2,'0')}`, ...Array.from({length:50},(_,i)=>`Text ${i+1}`) ];
    const rows = [1,2,3,4,5].map(makeRow);
    const csv = [header.join(','), ...rows.map(r=>r.join(','))].join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='StaticTextImportTemplate.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  }
  async onStaticTextImportFileSelected(event: Event){
    const input = event.target as HTMLInputElement; const file = input.files && input.files[0]; if(!file) return;
    try {
      const { rawRows, headers } = await parseCsvFile(file, 5000);
      this.stImportRawRows.set(rawRows); this.stImportHeaders.set(headers);
      this.stAutoMapImportHeaders(); this.stRebuildMappedRows(); this.stImportState.set({open:true, step:'mapping'});
    } catch {
      this.error.set('Failed to parse CSV');
    }
  }
  stAutoMapImportHeaders(){
  const headers = this.stImportHeaders();
  const mapping = autoMapHeaders(headers, this.stImportFieldDefinitions, this.stImportMapping());
  this.stImportMapping.set(enforceUniqueMapping(mapping));
  }
  stUpdateImportMapping(csvHeader:string, target:string){ const mapping={...this.stImportMapping()}; if(!target) delete mapping[csvHeader]; else mapping[csvHeader]=target; const rev: {[t:string]:string}={}; for(const [h,t] of Object.entries(mapping)){ if(rev[t]&&rev[t]!==h){ delete mapping[rev[t]]; } rev[t]=h; } this.stImportMapping.set(mapping); this.stRebuildMappedRows(); }
  private stRebuildMappedRows(){ const raw=this.stImportRawRows(); const rows = raw.map((r:any,i:number)=> this.stMapImportRow(r,i+2)); this.stImportRows.set(rows); }
  stRequiredImportFieldsMapped(){ const mapped=new Set(Object.values(this.stImportMapping())); return this.stImportRequiredKeys.every(k=> mapped.has(k)); }
  stGoToPreviewFromMapping(){ if(this.stRequiredImportFieldsMapped()) this.stImportState.set({open:true, step:'preview'}); }
  stBackToMapping(){ if(this.stImportState().step==='preview') this.stImportState.set({open:true, step:'mapping'}); }
  private stMapImportRow(r:any,line:number){
    const trim=(v:any)=> (v===undefined||v===null?'':String(v).trim()); const mapping=this.stImportMapping(); const getVal=(target:string)=>{ const header=Object.entries(mapping).find(([,t])=> t===target)?.[0]; return header? r[header] : ''; };
    const row:any = { original:r, line, number: trim(getVal('number')||r.number), description: trim(getVal('description')||r.description||''), items: {}, error:'' };
    for(let i=1;i<=50;i++){ const key=`item${i}`; const v=trim(getVal(key)||r[key]); if(v) row.items[i]=v; }
    if(!row.number) row.error+='missing number; ';
    return row;
  }
  stInvalidImportRowCount(){ return this.stImportRows().filter(r=>r.error).length; }
  stStartImport(){
    this.stImportCancelled=false;
    this.stImportProgress.set({processed:0, success:0, created:0, updated:0, failed:0, percent:0, done:false});
    const rows=this.stImportRows().filter(r=>!r.error);
    this.stImportRows.set(rows);
    this.stImportState.set({open:true, step:'running'});
    runConcurrentQueue(rows, (row)=> this.stProcessImportRow(row).then(()=> this.sleep(200)), {
      concurrency: 1,
      getCancelled: () => this.stImportCancelled,
      onItemDone: () => this.stUpdateImportProgress(),
      onDone: () => { /* handled in stUpdateImportProgress */ }
    });
  }
  stCancelImport(){ this.stImportCancelled=true; }
  private stPumpImportQueue(){ /* replaced by runConcurrentQueue */ }
  private async stProcessImportRow(row:any){
    try{
      const payload = { number: row.number, description: row.description, items: Array.from({length:50},(_,i)=> ({ number:i+1, textValue: row.items[i+1]||'', sendFormat:false })) };
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}`, 'Content-Type':'application/json' });
      const requestUrl = `${this.apiConfig.getBaseUrl()}/extensions/api/StaticTexts/CreateAndUpdateStaticText`;
  await this.http.post(requestUrl, payload, { headers }).toPromise();
      // keep last debug entry for imports
      this.debugApiResponses.stCreateOrUpdate = {
        timestamp: new Date().toISOString(),
        requestUrl,
        requestHeaders: { ...headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {}) },
        requestBody: payload,
        rawResponse: { status: 'ok (import row)'}
      };
      row.status='created';
    }catch(e:any){ row.status='failed'; row.error = e?.error?.title || e?.message || 'error'; }
  }
  private stUpdateImportProgress(){ const rows=this.stImportRows(); const processed=rows.filter(r=>r.status).length; const created=rows.filter(r=>r.status==='created').length; const updated=rows.filter(r=>r.status==='updated').length; const success=created+updated; const failed=rows.filter(r=>r.status==='failed').length; const percent=rows.length? Math.round(processed*100/rows.length):0; const done=processed===rows.length || this.stImportCancelled; this.stImportProgress.set({processed, success, created, updated, failed, percent, done}); if(done) this.stFinishImport(); }
  private stFinishImport(){ this.stImportState.set({open:true, step:'done'}); }
  stDownloadImportErrors(){
    const errs=this.stImportRows().filter(r=>r.status==='failed'); if(!errs.length) return;
    const rows = errs.map(r=>`${r.line},"${r.number}","${(r.error||'').replace(/"/g,'""')}"`);
    downloadCsv('static-text-import-errors.csv','line,number,error\n',rows);
  }
  private stImportCancelled = false; private stImportConcurrency = 3; private stActiveImports = 0; private stImportQueueIndex = 0;

  private buildImportFieldDefinitions(){
    const defs: Array<{key:string; label:string; required?:boolean; synonyms:string[]}> = [];
    const push=(key:string,label:string,synonyms:string[]=[],required=false)=>{ defs.push({key,label,required,synonyms}); };
    // Article top-level
    push('number','Article Number',['number','articlenumber','no','artno'],true);
    push('name','Name',['name','articlename'],true);
    push('description','Description',['description','desc']);
    push('active','Active',['active','enabled','isactive']);
    // Currency (GX price currency code)
    push('gxPriceCurrencyCode','Currency',[
      'currency','currencycode','currcode','curr','pricecurrency','gxpricecurrency'
    ]);
    // Labeler enable flag
    push('isEnabledForLabelers','Labeler Enabled',[
      'labeler enabled','labelerenabled','islabelerenabled','labelerenable','labeleractive','labeler'
    ]);
    // PLU common
    push('labelingMode','Labeling Mode',['labelingmode','mode']);
    push('weightUnit','Weight Unit',['unit','weightunit','wtunit']);
    push('unitPriceValue','Unit Price',['unitprice','unitpricevalue','price','pricevalue','unitpricevalue']);
    push('specialUnitPriceValue','Special Unit Price',['specialprice','specialunitprice']);
    push('tareWeightValue','Tare Weight',['tare','tareweight']);
    push('fixedWeightValue','Fixed Weight',['fixedweight']);
    push('minWeightValue','Minimum Weight',['minweight','minimumweight']);
    push('maxWeightValue','Maximum Weight',['maxweight','maximumweight']);
    push('shelfLifeDays1','Shelf Life Days 1',['shelflife1','shelflifedays1']);
    push('shelfLifeDays2','Shelf Life Days 2',['shelflife2','shelflifedays2']);
    push('labelParameter','Label Parameter',['labelparameter','labelparametersetno','labelparameterset']);
    push('automaticLabelParameter','Automatic Label Parameter',['automaticlabelparameter']);
    push('piecesPerPackage','Pieces Per Package',['piecesperpackage']);
    push('numberOfSuccessiveLabels','Number Of Successive Labels',['numberofsuccessivelabels','successivelabels']);
    push('numberOfLabelCopies','Number Of Label Copies',['numberoflabelcopies','labelcopies']);
    push('weightClass','Weight Class',['weightclass','weightclassno']);
    push('productGroupNumber','Product Group Number',['productgroupnumber']);
    push('tendencyControl','Tendency Control',['tendencycontrol']);
    push('staticText','Static Text Param #',[
      'statictext','statictextparameter','statictextparam','statictextparamno','statictextparameterno',
      'statictextparameternumber','statictextparamnumber','statictextparameterno','statictextparameter#','statictextparam#'
    ]);
    // Numeric series helpers
    for(let i=1;i<=10;i++) push(`logoField${i}`,`Logo ${i}`,[`logo${i}`,`logofield${i}`]);
    for(let i=1;i<=7;i++) push(`codeField${i}`,`Code Field ${i}`,[`codenumber${i}`,`codefield${i}`]);
    for(let i=1;i<=7;i++) push(`codeString${i}`,`Code String ${i}`,[`codestring${i}`,`codesubstring${i}`,`codesubstr${i}`]);
    for(let i=1;i<=20;i++) push(`generalNumber${i}`,`General Number ${i}`,[`generalnumber${i.toString().padStart(2,'0')}`,`generalnumber${i}`]);
    for(let i=1;i<=30;i++) push(`simpleText${i}`,`Simple Text ${i}`,[`simpletext${i.toString().padStart(2,'0')}`,`simpletext${i}`,`st${i}`]);
  for(let i=1;i<=20;i++) push(`textField${i}Text`,`Text Field ${i} (text)`,[`textfield${i}`,`textfeld${i}`,`textfield${i}text`]);
  for(let i=1;i<=20;i++) push(`textField${i}Number`,`Text Field ${i} (number)`,[`textfield${i}number`,`textfield${i}num`,`textfeld${i}number`]);
    // Date Text Fields: ensure Text variant is defined BEFORE Number variant so auto-map & dropdown favor text.
    for(let i=1;i<=3;i++) push(
      `dateTextField${i}Text`,
      `Date Text Field ${i} (text)`,
      [
        `datetextfield${i}`,
        `date text field ${i}`,
        `datetextfield${i}text`,
        `datetextfield${i}txt`
      ]
    );
    for(let i=1;i<=3;i++) push(
      `dateTextField${i}Number`,
      `Date Text Field ${i} (number)`,
      [
        `datetextfieldno${i}`,
        `datetextfield${i}number`,
        `datetextfield${i}num`,
        `datetextfield${i}nbr`
      ]
    );
    return defs;
  }
  private importCancelled = false;
  private importConcurrency = 1;
  private activeImports = 0;
  private importQueueIndex = 0;

  ngOnInit() {
    // Initialize with proper ArticlePLU structure
    this.newArticle.update(article => ({
      ...article,
      articlePLU: this.createEmptyArticlePLU()
    }));
    
    // Initialize dark mode detection
    this.updateDarkModeState();
    
    // Set up observer for dark mode changes
    const observer = new MutationObserver(() => {
      this.updateDarkModeState();
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    this.loadArticles();
  }
  
  private updateDarkModeState() {
    this.isDarkMode.set(document.body.classList.contains('dark-theme'));
  }

  // -------- Import CSV UI Methods --------
  openImportDialog(){
  this.importState.set({open:true, step:'select'});
  this.importRows.set([]);
  this.importRawRows.set([]);
  this.importHeaders.set([]);
  this.importMapping.set({});
  this.importProgress.set({processed:0, success:0, created:0, updated:0, failed:0, percent:0, done:false});
  document.body.classList.add('has-import-open');
  }
  closeImportDialog(){
    if(this.importState().step==='running' && !this.importProgress().done){ this.importCancelled = true; }
    this.importState.set({open:false, step:'select'});
    document.body.classList.remove('has-import-open');
  }
  // Download CSV template (served from assets/import folder)
  downloadImportTemplate(){
    // Generate a simple CSV template on the fly (header + 2 sample rows)
    const header = [
      'Article Number','Name','Labeling mode','Active','Labeler Enabled','Description','Unit','Shelf life 1',
      'Simple text 01','Simple text 02','Simple text 03','Static Text Param #','Tare Weight','Unit Price',
      'Special price','Currency','Automatic Label Parameter','Code number 1','Code number 2','Code number 3',
      'Code substring 1','Code substring 2','Code substring 3','Date Text Field 1','Date Text Field 2','Fixed weight',
      'General number 01','General number 02','Text Field 1','Text Field 2','Text Field 3','Text Field 4','Text Field 5',
      'Text Field 6','Text Field 7','Text Field 8','Text Field 9','Text Field 10','Label parameter set no.',
      'Logo 1','Logo 2','Minimum weight','Maximum weight','Pieces per package','Weight class no.'
    ];
    const today = new Date().toISOString().substring(0,10);
    const sample1 = [
      '2001','Sample Article 1','Weight','TRUE','TRUE','Short description','lb','10',
      'simple text 1','simple text2','st3','1122','0.08','19.99','17.99','USD','1','1','2','3',
      '12345678901','codesubstr2','','Packed On:','Sell By:','1.7500','1','2',
      'Example TF1','Example TF2','Example TF3','','','','','','','','','1','2','1.75','2.5','8','1'
    ];
    const sample2 = [
      '2002','Sample Article 2','Weight','TRUE','TRUE','Another description','lb','7',
      'fresh','quality','','1001','0.05','8.49','','USD','1','1','2','3',
      '2343412001','','','Packed On:','Sell By:','1.0000','','','',
      '','','','','','','','','','','1','','0.5','1.75','4','1'
    ];
    const csv = [header.join(','), sample1.join(','), sample2.join(',')].join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `PLU-Import-Template-${today}.csv`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  }
  async onImportFileSelected(event: Event){
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if(!file) return;
    try {
      const { rawRows, headers } = await parseCsvFile(file, 5000);
  this.importRawRows.set(rawRows);
  this.debugApiResponses.csvImport = { phase: 'parsed', rawRowCount: rawRows.length, headers, timestamp: new Date().toISOString() };
      this.importHeaders.set(headers);
      // attempt auto map
      this.autoMapImportHeaders();
  this.rebuildMappedRows();
  this.debugApiResponses.csvImport = { ...this.debugApiResponses.csvImport, phase: 'mapped', mapping: this.importMapping(), timestamp: new Date().toISOString() };
      // Always show mapping step so user can see what auto-mapped
      this.importState.set({open:true, step:'mapping'});
    } catch {
      this.error.set('Failed to parse CSV');
    }
  }
  private normalizeHeaderName(h:string){ return h.toLowerCase().replace(/[^a-z0-9]/g,''); }
  autoMapImportHeaders(){
    const headers = this.importHeaders();
    const existing = this.importMapping();
    const mapping = autoMapHeaders(headers, this.importFieldDefinitions, existing, {
      extraMatcher: (norm, compact, used) => {
        // Prefer text variant when bare "date text field X" appears
        let m = norm.match(/^date text field (\d)$/);
        if (m) {
          const key = `dateTextField${m[1]}Text`;
          if (!used.has(key)) return key;
        }
        // Explicit number tokens
        m = norm.match(/^date text field (\d) number$/) || norm.match(/^date text field (\d) num$/) || norm.match(/^date text field (\d) nbr$/);
        if (m) {
          const key = `dateTextField${m[1]}Number`;
          if (!used.has(key)) return key;
        }
        // "Date text field no X" -> Number variant
        m = norm.match(/^date text field no (\d)$/) || compact.match(/^datetextfieldno(\d)$/) as any;
        if (m) {
          const idx = Array.isArray(m) ? m[1] : (m as any)[1];
          const key = `dateTextField${idx}Number`;
          if (!used.has(key)) return key;
        }
        // Series helpers
        m = compact.match(/^simpletext(\d{1,2})$/) as any; if (m) { const n=parseInt(m[1],10); if(n>=1&&n<=30) return `simpleText${n}`; }
        m = compact.match(/^generalnumber(\d{1,2})$/) as any; if (m) { const n=parseInt(m[1],10); if(n>=1&&n<=20) return `generalNumber${n}`; }
        m = compact.match(/^logo(\d{1,2})$/) as any; if (m) { const n=parseInt(m[1],10); if(n>=1&&n<=10) return `logoField${n}`; }
        m = compact.match(/^codenumber(\d)$/) as any; if (m) { return `codeField${m[1]}`; }
        m = compact.match(/^codesubstring(\d)$/) as any; if (m) { return `codeString${m[1]}`; }
        m = compact.match(/^generaltextfieldno(\d)$/) as any; if (m) { return `textField${m[1]}Number`; }
        return undefined;
      }
    });
    this.importMapping.set(enforceUniqueMapping(mapping));
  }
  updateImportMapping(csvHeader:string, target:string){
    const mapping = { ...this.importMapping() };
    if(!target) delete mapping[csvHeader]; else mapping[csvHeader] = target;
    // enforce uniqueness (latest wins)
    const reversed: {[target:string]: string} = {};
    for(const [h,t] of Object.entries(mapping)){
      if(reversed[t] && reversed[t]!==h){ delete mapping[reversed[t]]; }
      reversed[t] = h;
    }
    this.importMapping.set(mapping);
    this.rebuildMappedRows();
  }
  private rebuildMappedRows(){
    const raw = this.importRawRows();
    const rows = raw.map((r:any,i:number)=> this.mapImportRow(r,i+2));
    this.importRows.set(rows);
  }
  requiredImportFieldsMapped(){
    const mappedTargets = new Set(Object.values(this.importMapping()));
    return this.importRequiredKeys.every(k=> mappedTargets.has(k));
  }
  goToPreviewFromMapping(){ if(this.requiredImportFieldsMapped()) this.importState.set({open:true, step:'preview'}); }
  backToMapping(){ if(this.importState().step==='preview') this.importState.set({open:true, step:'mapping'}); }
  mapImportRow(r:any,line:number){
    const trim = (v:any)=> (v===undefined||v===null?'':String(v).trim());
    const mapping = this.importMapping();
    const getVal = (target:string)=>{
      const header = Object.entries(mapping).find(([,t])=> t===target)?.[0];
      if(!header) return '';
      return r[header];
    };
    const parseNumber = (val:any)=>{ const t=trim(val); if(!t) return 0; const m=t.match(/-?\d+(?:[.,]\d+)?/); return m? parseFloat(m[0].replace(',','.')):0; };
  const parseBool = (val:any)=> /^true|1|yes$/i.test(trim(val));
  const mappingKeys = Object.values(mapping);
    const row:any = {
      original:r,
      line,
      number: trim(getVal('number')||r.number||r.articleNumber),
      name: trim(getVal('name')||r.name||r.articleName),
      description: trim(getVal('description')||r.description||''),
      labelingMode: this.normalizeLabelingMode(trim(getVal('labelingMode')||r.labelingMode)),
      unitPriceValue: parseNumber(getVal('unitPriceValue')||r.unitPriceValue||r.price),
      specialUnitPriceValue: parseNumber(getVal('specialUnitPriceValue')||r.specialUnitPriceValue),
      tareWeightValue: parseNumber(getVal('tareWeightValue')||r.tareWeightValue||r.tare),
      labelParameter: parseInt(trim(getVal('labelParameter')||r.labelParameter||r.labelParam||'0'))||0,
      shelfLifeDays1: parseInt(trim(getVal('shelfLifeDays1')||r.shelfLifeDays1||r.shelfLife1||'0'))||0,
      active: parseBool(getVal('active')||r.active||'true'),
      weightUnit: trim(getVal('weightUnit')||r.weightUnit||'lb').replace(/[^a-zA-Z]/g,'')||'lb',
      simpleText1: trim(getVal('simpleText1')||r.simpleText1||''),
      simpleText2: trim(getVal('simpleText2')||r.simpleText2||''),
      simpleText3: trim(getVal('simpleText3')||r.simpleText3||''),
      staticText: parseInt(trim(getVal('staticText')||r.staticText||'0'))||0,
  isEnabledForLabelers: parseBool(getVal('isEnabledForLabelers')||r.isEnabledForLabelers||r.labelerEnabled||'true'),
  gxPriceCurrencyCode: trim(getVal('gxPriceCurrencyCode')||r.gxPriceCurrencyCode||r.currency||'USD').toUpperCase() || 'USD',
      codeField1: parseInt(trim(getVal('codeField1')||r.codeField1||'0'))||0,
      codeField2: parseInt(trim(getVal('codeField2')||r.codeField2||'0'))||0,
      codeField3: parseInt(trim(getVal('codeField3')||r.codeField3||'0'))||0,
      codeString1: trim(getVal('codeString1')||r.codeString1||''),
      codeString2: trim(getVal('codeString2')||r.codeString2||''),
      codeString3: trim(getVal('codeString3')||r.codeString3||''),
  // Do not default text field numbers to -1; only set if explicitly provided
  dateTextField1: ((): any => { const raw = trim(getVal('dateTextField1')||r.dateTextField1||''); const n = raw!=='' ? parseInt(raw) : undefined; return Number.isFinite(n as any) ? n : undefined; })(),
  dateTextField2: ((): any => { const raw = trim(getVal('dateTextField2')||r.dateTextField2||''); const n = raw!=='' ? parseInt(raw) : undefined; return Number.isFinite(n as any) ? n : undefined; })(),
      fixedWeightValue: parseNumber(getVal('fixedWeightValue')||r.fixedWeightValue),
      generalNumber1: parseInt(trim(getVal('generalNumber1')||r.generalNumber1||'0'))||0,
      generalNumber2: parseInt(trim(getVal('generalNumber2')||r.generalNumber2||'0'))||0,
  textField1: ((): any => { const raw = trim(getVal('textField1')||r.textField1||''); const n = raw!=='' ? parseInt(raw) : undefined; return Number.isFinite(n as any) ? n : undefined; })(),
  textField2: ((): any => { const raw = trim(getVal('textField2')||r.textField2||''); const n = raw!=='' ? parseInt(raw) : undefined; return Number.isFinite(n as any) ? n : undefined; })(),
  textField3: ((): any => { const raw = trim(getVal('textField3')||r.textField3||''); const n = raw!=='' ? parseInt(raw) : undefined; return Number.isFinite(n as any) ? n : undefined; })(),
      logoField1: parseInt(trim(getVal('logoField1')||r.logoField1||'0'))||0,
      maxWeightValue: parseNumber(getVal('maxWeightValue')||r.maxWeightValue),
      minWeightValue: parseNumber(getVal('minWeightValue')||r.minWeightValue),
      piecesPerPackage: parseInt(trim(getVal('piecesPerPackage')||r.piecesPerPackage||'0'))||0,
      weightClass: parseInt(trim(getVal('weightClass')||r.weightClass||'0'))||0,
      status:'',
      error:''
    };
    // Dynamic series extraction
    for(let i=1;i<=30;i++){ if(mappingKeys.includes(`simpleText${i}`)) row[`simpleText${i}`] = trim(getVal(`simpleText${i}`)); }
    for(let i=1;i<=20;i++){ if(mappingKeys.includes(`generalNumber${i}`)) row[`generalNumber${i}`] = parseInt(trim(getVal(`generalNumber${i}`)||'0'))||0; }
    for(let i=1;i<=10;i++){ if(mappingKeys.includes(`logoField${i}`)) row[`logoField${i}`] = parseInt(trim(getVal(`logoField${i}`)||'0'))||0; }
    for(let i=1;i<=7;i++){ if(mappingKeys.includes(`codeField${i}`)) row[`codeField${i}`] = parseInt(trim(getVal(`codeField${i}`)||'0'))||0; }
    for(let i=1;i<=7;i++){ if(mappingKeys.includes(`codeString${i}`)) row[`codeString${i}`] = trim(getVal(`codeString${i}`)); }
    for(let i=1;i<=20;i++){
      if(mappingKeys.includes(`textField${i}Number`)){
        const raw = trim(getVal(`textField${i}Number`)||'');
        if(raw!=='') { const n = parseInt(raw); if(Number.isFinite(n)) row[`textField${i}Number`] = n; }
      }
      if(mappingKeys.includes(`textField${i}Text`)) row[`textField${i}Text`] = trim(getVal(`textField${i}Text`));
    }
    for(let i=1;i<=3;i++){
      if(mappingKeys.includes(`dateTextField${i}Number`)){
        const raw = trim(getVal(`dateTextField${i}Number`)||'');
        if(raw!=='') { const n = parseInt(raw); if(Number.isFinite(n)) row[`dateTextField${i}Number`] = n; }
      }
      if(mappingKeys.includes(`dateTextField${i}Text`)) row[`dateTextField${i}Text`] = trim(getVal(`dateTextField${i}Text`));
    }
    if(!row.number || row.number.length>20) row.error += 'invalid number; ';
    if(!row.name || row.name.length>64) row.error += 'invalid name; ';
    if(row.description && row.description.length>64) row.error += 'desc>64; ';
    if(row.labelingMode && !this.allowedLabelingModes.includes(row.labelingMode)) row.error += 'mode; ';
    return row;
  }
  invalidImportRowCount(){ return this.importRows().filter(r=>r.error).length; }
  startImport(){
    this.importCancelled = false;
    this.importProgress.set({processed:0, success:0, created:0, updated:0, failed:0, percent:0, done:false});
    const rows = this.importRows().filter(r=>!r.error);
    this.importRows.set(rows);
    this.importState.set({open:true, step:'running'});
  this.debugApiResponses.csvImport = { ...this.debugApiResponses.csvImport, phase: 'running', total: rows.length, timestamp: new Date().toISOString() };
  runConcurrentQueue(rows, (row)=> this.processImportRow(row).then(()=> this.sleep(200)), {
      concurrency: this.importConcurrency,
      getCancelled: () => this.importCancelled,
      onItemDone: () => this.updateImportProgress(),
      onDone: () => { this.debugApiResponses.csvImport = { ...this.debugApiResponses.csvImport, phase: 'done', timestamp: new Date().toISOString() }; /* updateImportProgress will decide finish */ }
    });
  }
  cancelImport(){ this.importCancelled = true; }
  private pumpImportQueue(){ /* replaced by runConcurrentQueue */ }
  private sleep(ms:number){ return new Promise<void>(res=>setTimeout(res, ms)); }
  private async processImportRow(row:any){
    try{
      const emptyPLU = this.createEmptyArticlePLU();
      const article: any = {
        number: row.number,
        name: row.name,
        description: row.description,
        isEnabledForLabelers: true,
        weightUnit: row.weightUnit || 'lb',
        weightDecimalPlaces: 2,
        active: row.active,
        approved: false,
  gxPriceCurrencyCode: row.gxPriceCurrencyCode || 'USD',
        gxPriceDecimalPlaces: 2,
        articlePLU: {
          ...emptyPLU,
          labelingMode: row.labelingMode,
          unitPriceValue: row.unitPriceValue,
          specialUnitPriceValue: row.specialUnitPriceValue || 0,
          tareWeightValue: row.tareWeightValue,
          labelParameter: row.labelParameter,
          shelfLifeDays1: row.shelfLifeDays1,
          simpleText1: row.simpleText1 || '',
          simpleText2: row.simpleText2 || '',
          simpleText3: row.simpleText3 || '',
          staticText: row.staticText || 0,
          codeField1: row.codeField1 || 0,
          codeField2: row.codeField2 || 0,
          codeField3: row.codeField3 || 0,
          codeString1: row.codeString1 || '',
          codeString2: row.codeString2 || '',
          codeString3: row.codeString3 || '',
          // Date Text Fields will be finalized below with precedence logic (number wins over inline text)
          dateTextField1: { ...emptyPLU.dateTextField1 },
          dateTextField2: { ...emptyPLU.dateTextField2 },
          dateTextField3: { ...emptyPLU.dateTextField3 },
          fixedWeightValue: row.fixedWeightValue || 0,
          generalNumber1: row.generalNumber1 || 0,
          generalNumber2: row.generalNumber2 || 0,
          // Text Fields 1-3 will be finalized below with precedence logic (number wins over inline text)
          textField1: { ...emptyPLU.textField1 },
          textField2: { ...emptyPLU.textField2 },
          textField3: { ...emptyPLU.textField3 },
          logoField1: row.logoField1 || 0,
          maxWeightValue: row.maxWeightValue || 0,
          minWeightValue: row.minWeightValue || 0,
          piecesPerPackage: row.piecesPerPackage || 0,
          weightClass: row.weightClass || 0
        }
      };
  // Apply precedence per field:
  // - If number is provided: set { number: N, text: null } and include in payload.
  // - Else if text is provided: set { number: -1, text } and include in payload.
  // - Else: do not include this field at all (let backend decide/assign).
      const setDateTextField = (i: 1|2|3) => {
        const numKeyA = `dateTextField${i}` as const;
        const numKeyB = `dateTextField${i}Number` as const;
        const textKey = `dateTextField${i}Text` as const;
        const n: any = (row as any)[numKeyB] ?? (row as any)[numKeyA];
        const t: any = (row as any)[textKey];
        if (n !== undefined && n !== null && Number.isFinite(Number(n))) {
          (article.articlePLU as any)[`dateTextField${i}`] = { number: Number(n), text: null };
        } else if (t != null && String(t).trim() !== '') {
          (article.articlePLU as any)[`dateTextField${i}`] = { number: -1, text: String(t) };
        } else {
          delete (article.articlePLU as any)[`dateTextField${i}`];
        }
      };
      setDateTextField(1); setDateTextField(2); setDateTextField(3);

      const setTextField = (i: number) => {
        const numKeyLegacy = `textField${i}` as const; // legacy numeric mapping
        const numKey = `textField${i}Number` as const;
        const textKey = `textField${i}Text` as const;
        const nRaw: any = (row as any)[numKey] ?? (row as any)[numKeyLegacy];
        const tRaw: any = (row as any)[textKey];
        if (nRaw !== undefined && nRaw !== null && Number.isFinite(Number(nRaw))) {
          // Include both number and optional text. If text is empty, send null.
          (article.articlePLU as any)[`textField${i}`] = { number: Number(nRaw), text: (tRaw != null && String(tRaw).trim() !== '') ? String(tRaw) : null };
        } else if (tRaw != null && String(tRaw).trim() !== '') {
          // No number provided, but text present -> include with number -1
          (article.articlePLU as any)[`textField${i}`] = { number: -1, text: String(tRaw) };
        } else {
          // Neither number nor text -> omit
          delete (article.articlePLU as any)[`textField${i}`];
        }
      };
      for (let i = 1; i <= 20; i++) setTextField(i);
      // dynamic series
      for(let i=4;i<=30;i++){ if(row[`simpleText${i}`]!==undefined) article.articlePLU[`simpleText${i}`] = row[`simpleText${i}`]; }
      for(let i=3;i<=20;i++){ if(row[`generalNumber${i}`]!==undefined) article.articlePLU[`generalNumber${i}`] = row[`generalNumber${i}`]; }
      for(let i=2;i<=10;i++){ if(row[`logoField${i}`]!==undefined) article.articlePLU[`logoField${i}`] = row[`logoField${i}`]; }
      for(let i=4;i<=7;i++){ if(row[`codeField${i}`]!==undefined) article.articlePLU[`codeField${i}`] = row[`codeField${i}`]; }
      for(let i=4;i<=7;i++){ if(row[`codeString${i}`]!==undefined) article.articlePLU[`codeString${i}`] = row[`codeString${i}`]; }
      // dateTextField3 handled by precedence logic above
      // Decide create vs update
      const authToken = this.auth.getToken();
      const jsonHeaders = new HttpHeaders({ 'Authorization': `Bearer ${authToken}`, 'Content-Type':'application/json'});
      let exists = false;
      try {
  await this.http.get(`${this.apiConfig.getBaseUrl()}/api/v1/articles/${encodeURIComponent(article.number)}/labeler`, { headers: jsonHeaders }).toPromise();
        exists = true;
      } catch(getErr:any) {
        exists = false; // 404 -> create
      }
      if(!exists){
        this.debugApiResponses.csvImport = { ...this.debugApiResponses.csvImport, lastRequest: { method:'POST', url:`${this.apiConfig.getBaseUrl()}/api/v1/articles/labeler`, body: article }, timestamp: new Date().toISOString() };
        const resp = await this.http.post(`${this.apiConfig.getBaseUrl()}/api/v1/articles/labeler`, article, {headers: jsonHeaders}).toPromise();
        this.debugApiResponses.csvImport = { ...this.debugApiResponses.csvImport, lastResponse: resp, timestamp: new Date().toISOString() };
        row.status = 'created';
      } else {
        // Prepare patch operations (ensure basePriceDivision set like updateArticle)
        if(article.articlePLU){ article.articlePLU.basePriceDivision = 'perUnit'; }
        const patchOps = this.createPatchOperations(article as LabelerArticle);
        const patchHeaders = new HttpHeaders({ 'Authorization': `Bearer ${authToken}`, 'Content-Type':'application/json-patch+json'});
        this.debugApiResponses.csvImport = { ...this.debugApiResponses.csvImport, lastRequest: { method:'PATCH', url:`${this.apiConfig.getBaseUrl()}/api/v1/articles/${encodeURIComponent(article.number)}/labeler`, body: patchOps }, timestamp: new Date().toISOString() };
        const resp = await this.http.patch(`${this.apiConfig.getBaseUrl()}/api/v1/articles/${encodeURIComponent(article.number)}/labeler`, patchOps, {headers: patchHeaders}).toPromise();
        this.debugApiResponses.csvImport = { ...this.debugApiResponses.csvImport, lastResponse: resp, timestamp: new Date().toISOString() };
        row.status = 'updated';
      }
    }catch(e:any){
      row.status = 'failed';
      row.error = e?.error?.title || e?.message || 'error';
      this.debugApiResponses.csvImport = { ...this.debugApiResponses.csvImport, lastError: row.error, timestamp: new Date().toISOString() };
    }
  }
  private updateImportProgress(){
    const rows = this.importRows();
    const processed = rows.filter(r=>r.status).length;
    const created = rows.filter(r=>r.status==='created').length;
    const updated = rows.filter(r=>r.status==='updated').length;
    const success = created + updated;
    const failed = rows.filter(r=>r.status==='failed').length;
    const percent = rows.length? Math.round(processed*100/rows.length):0;
    const done = processed===rows.length || this.importCancelled;
    this.importProgress.set({processed, success, created, updated, failed, percent, done});
    if(done) this.finishImport();
  }
  
  // Manual refresh of current list (keeps pagination & filters)
  refreshList(){
    this.loadArticles();
  }
  private finishImport(){
    this.importState.set({open:true, step:'done'});
  }

  // Helper to style preview columns (Text Field 1-10 wider)
  isWideTextFieldHeader(h:string){
    if(!h) return false;
    const norm = h.toLowerCase().replace(/[^a-z0-9]/g,''); // remove spaces/punct
    // Match textfield1..textfield10 or "text field 01" forms
    const m = norm.match(/^textfield(\d{1,2})$/);
    if(!m) return false;
    const n = parseInt(m[1],10);
    return n>=1 && n<=10;
  }
  downloadImportErrors(){
  const errs = this.importRows().filter(r=>r.status==='failed');
  if(!errs.length) return;
  const rows = errs.map(r=>`${r.line},"${r.number}","${r.name}","${(r.error||'').replace(/"/g,'""')}"`);
  downloadCsv('import-errors.csv','line,number,name,error\n',rows);
  }

  async loadArticles() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.auth.getToken()}`,
        'Content-Type': 'application/json'
      });

      const params = this.searchParams();
      const queryString = this.buildQueryString(params);
  const requestUrl = `${this.apiConfig.getBaseUrl()}/api/v1/articles/labeler${queryString}`;
      
      const response = await this.http.get<LabelerArticle[]>(
        requestUrl,
        { headers }
      ).toPromise();

      this.articles.set(response || []);
      
      // Store debug information
      this.debugApiResponses.listArticles = {
        timestamp: new Date().toISOString(),
        requestUrl: requestUrl,
        requestHeaders: { ...headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {}) },
        requestParams: params,
        rawResponse: response,
        articles: this.articles()
      };
    } catch (error: any) {
      console.error('Error loading articles:', error);
      this.error.set(error?.error?.title || 'Failed to load articles');
      
      // Store error debug information
      const params = this.searchParams();
      const queryString = this.buildQueryString(params);
  const requestUrl = `${this.apiConfig.getBaseUrl()}/api/v1/articles/labeler${queryString}`;
      this.debugApiResponses.listArticles = {
        timestamp: new Date().toISOString(),
        requestUrl: requestUrl,
        requestParams: params,
        error: error
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadArticleByNumber(articleNumber: string) {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.auth.getToken()}`,
        'Content-Type': 'application/json'
      });

  const requestUrl = `${this.apiConfig.getBaseUrl()}/api/v1/articles/${encodeURIComponent(articleNumber)}/labeler`;
      const response = await this.http.get<LabelerArticle>(
        requestUrl,
        { headers }
      ).toPromise();

      this.selectedArticle.set(response || null);
      // Normalize labeling mode if backend returned legacy values
      if (response?.articlePLU) {
        response.articlePLU.labelingMode = this.normalizeLabelingMode(response.articlePLU.labelingMode);
      }
      // Populate edit buffers for existing text field numbers
      this.rawTextFieldNumbersEdit = {};
      if (response?.articlePLU) {
        for (let i = 1; i <= 20; i++) {
          const key = `textField${i}` as keyof ArticlePLU;
          const tf = response.articlePLU[key] as TextField;
            if (tf && tf.number !== -1) {
              this.rawTextFieldNumbersEdit[key] = tf.number.toString();
            }
        }
      }
      // Sync raw unit price buffer for edit view
      const up = response?.articlePLU?.unitPriceValue;
      this.selectedUnitPriceInput.set(
        up === undefined || up === null ? '' : up.toString()
      );
      
      // Store debug information
      this.debugApiResponses.getArticle = {
        timestamp: new Date().toISOString(),
        requestUrl: requestUrl,
        requestHeaders: { ...headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {}) },
        articleNumber: articleNumber,
        rawResponse: response,
        selectedArticle: this.selectedArticle()
      };
      
      return response;
    } catch (error: any) {
      console.error('Error loading article:', error);
      this.error.set(error?.error?.title || 'Failed to load article');
      
      // Store error debug information
  const requestUrl = `${this.apiConfig.getBaseUrl()}/api/v1/articles/${encodeURIComponent(articleNumber)}/labeler`;
      this.debugApiResponses.getArticle = {
        timestamp: new Date().toISOString(),
        requestUrl: requestUrl,
        articleNumber: articleNumber,
        error: error
      };
      
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  async createArticle() {
    const article = this.newArticle();
    
    if (!article.number || !article.name) {
      this.error.set('Article number and name are required');
      return;
    }

    // Ensure basePriceDivision is always set to "perUnit"
    if (article.articlePLU) {
      article.articlePLU.basePriceDivision = 'perUnit';
    }

    // Add required currency fields for labelers
    article.gxPriceCurrencyCode = 'USD';
    article.gxPriceDecimalPlaces = 2;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.auth.getToken()}`,
        'Content-Type': 'application/json'
      });

  const requestUrl = `${this.apiConfig.getBaseUrl()}/api/v1/articles/labeler`;
      // capture payload
      this.debugApiResponses.createArticle = {
        timestamp: new Date().toISOString(),
        requestUrl,
        requestHeaders: { ...headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {}) },
        requestBody: article
      };
      const response = await this.http.post<LabelerArticle>(
        requestUrl,
        article,
        { headers }
      ).toPromise();

      // Store debug information
      this.debugApiResponses.createArticleResponse = {
        timestamp: new Date().toISOString(),
        requestUrl: requestUrl,
        rawResponse: response
      };

      if (response) {
        await this.loadArticles(); // Refresh the list
        this.apiResponse.set({
          type: 'success',
          message: `Article "${article.number}" created successfully!`,
          timestamp: new Date().toISOString()
        });
        // Brief delay then return to list view
        setTimeout(() => {
          this.goToListPage();
          this.resetNewArticleForm();
        }, 1200);
      }
    } catch (error: any) {
      console.error('Error creating article:', error);
      const errorMessage = error?.error?.message || error?.error?.title || 'Failed to create article';
      this.error.set(errorMessage);
      this.apiResponse.set({
        type: 'error',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
      
      // Store error debug information
  const requestUrl = `${this.apiConfig.getBaseUrl()}/api/v1/articles/labeler`;
      this.debugApiResponses.createArticleResponse = {
        timestamp: new Date().toISOString(),
        requestUrl: requestUrl,
        requestBody: article,
        error: error
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateArticle(article: LabelerArticle) {
    // Ensure basePriceDivision is always set to "perUnit"
    if (article.articlePLU) {
      article.articlePLU.basePriceDivision = 'perUnit';
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.auth.getToken()}`,
        'Content-Type': 'application/json-patch+json'
      });

      // Create JSON patch operations for the update
      const patchOperations = this.createPatchOperations(article);
  const requestUrl = `${this.apiConfig.getBaseUrl()}/api/v1/articles/${encodeURIComponent(article.number)}/labeler`;

      this.debugApiResponses.updateArticle = {
        timestamp: new Date().toISOString(),
        requestUrl: requestUrl,
        requestHeaders: { ...headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {}) },
        requestBody: patchOperations,
        article: article
      };
      const updateResp = await this.http.patch(
        requestUrl,
        patchOperations, // Send the array directly, not wrapped in an object
        { headers }
      ).toPromise();

      // Store debug information
      this.debugApiResponses.updateArticleResponse = {
        timestamp: new Date().toISOString(),
        requestUrl: requestUrl,
        response: updateResp
      };

      await this.loadArticles(); // Refresh the list
      this.closeEditModal();
    } catch (error: any) {
      console.error('Error updating article:', error);
      this.error.set(error?.error?.title || 'Failed to update article');
      
      // Store error debug information
      const patchOperations = this.createPatchOperations(article);
  const requestUrl = `${this.apiConfig.getBaseUrl()}/api/v1/articles/${encodeURIComponent(article.number)}/labeler`;
      this.debugApiResponses.updateArticleResponse = {
        timestamp: new Date().toISOString(),
        requestUrl: requestUrl,
        requestBody: patchOperations,
        article: article,
        error: error
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveCopiedArticle(article: LabelerArticle) {
    // Validate that PLU number is provided
    if (!article.number || article.number.trim() === '') {
      this.error.set('PLU Number is required');
      this.apiResponse.set({
        type: 'error',
        message: 'PLU Number is required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Ensure basePriceDivision is always set to "perUnit"
    if (article.articlePLU) {
      article.articlePLU.basePriceDivision = 'perUnit';
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.auth.getToken()}`,
        'Content-Type': 'application/json'
      });

      // Use POST to create new article (same as createArticle)
  const requestUrl = `${this.apiConfig.getBaseUrl()}/api/v1/articles/labeler`;
      await this.http.post(requestUrl, article, { headers }).toPromise();

      // Store debug information
      this.debugApiResponses.createArticle = {
        timestamp: new Date().toISOString(),
        requestUrl: requestUrl,
        requestHeaders: { ...headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {}) },
        requestBody: article
      };

      this.apiResponse.set({
        type: 'success',
        message: `Article ${article.number} copied successfully!`,
        timestamp: new Date().toISOString()
      });

      await this.loadArticles(); // Refresh the list
      this.closeCopyModal();
    } catch (error: any) {
      console.error('Error saving copied article:', error);
      const errorMessage = error?.error?.message || error?.error?.title || 'Failed to save copied article';
      this.error.set(errorMessage);
      this.apiResponse.set({
        type: 'error',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
      
      // Store error debug information
  const requestUrl = `${this.apiConfig.getBaseUrl()}/api/v1/articles/labeler`;
      this.debugApiResponses.createArticle = {
        timestamp: new Date().toISOString(),
        requestUrl: requestUrl,
        requestBody: article,
        error: error
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteArticle(articleNumber: string) {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.auth.getToken()}`
      });

  const requestUrl = `${this.apiConfig.getBaseUrl()}/api/v1/articles/${encodeURIComponent(articleNumber)}`;
      await this.http.delete(
        requestUrl,
        { headers }
      ).toPromise();

      // Store debug information
      this.debugApiResponses.deleteArticle = {
        timestamp: new Date().toISOString(),
        requestUrl: requestUrl,
        requestHeaders: { ...headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {}) },
        articleNumber: articleNumber
      };

      await this.loadArticles(); // Refresh the list
      this.closeDeleteConfirm();
    } catch (error: any) {
      console.error('Error deleting article:', error);
      this.error.set(error?.error?.title || 'Failed to delete article');
      
      // Store error debug information
  const requestUrl = `${this.apiConfig.getBaseUrl()}/api/v1/articles/${encodeURIComponent(articleNumber)}`;
      this.debugApiResponses.deleteArticle = {
        timestamp: new Date().toISOString(),
        requestUrl: requestUrl,
        articleNumber: articleNumber,
        error: error
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  // Search and filter methods
  onSearch() {
    this.searchParams.update(params => ({ ...params, skip: 0 }));
    this.loadArticles();
  }

  clearSearch() {
    this.searchParams.update(params => ({
      ...params,
      articleName: '',
      articleNumber: '',
      skip: 0
    }));
    this.loadArticles();
  }

  // Pagination methods
  previousPage() {
    const params = this.searchParams();
    const pageSize = params.take || 10;
    const newSkip = Math.max(0, (params.skip || 0) - pageSize);
    this.searchParams.update(p => ({ ...p, skip: newSkip }));
    this.loadArticles();
  }

  nextPage() {
    const params = this.searchParams();
    const pageSize = params.take || 10;
    const newSkip = (params.skip || 0) + pageSize;
    this.searchParams.update(p => ({ ...p, skip: newSkip }));
    this.loadArticles();
  }

  updatePageSize(newPageSize: number) {
    // Reset to first page when changing page size
    console.log('updatePageSize called with:', newPageSize, 'type:', typeof newPageSize);
    console.log('Current searchParams before update:', this.searchParams());
    
    this.searchParams.update(p => {
      const newParams = { 
        ...p, 
        take: newPageSize,
        skip: 0 
      };
      console.log('New params after update:', newParams);
      return newParams;
    });
    
    console.log('searchParams after signal update:', this.searchParams());
    this.loadArticles();
  }

  // Helper to get available page size options
  getPageSizeOptions(): number[] {
    return [10, 25, 50, 100, 200, 500];
  }

  // Helper to get current page number (1-based)
  getCurrentPage(): number {
    const params = this.searchParams();
    const pageSize = params.take || 10;
    return Math.floor((params.skip || 0) / pageSize) + 1;
  }

  // ---------------- Devices & Production Lines ----------------
  devices = signal<any[]>([]);
  productionLines = signal<any[]>([]);
  devicesLoading = signal(false);
  productionLinesLoading = signal(false);
  devicesError = signal<string|undefined>(undefined);
  productionLinesError = signal<string|undefined>(undefined);
  private devicesLoadedOnce = false;
  private productionLinesLoadedOnce = false;

  loadDevices(){
    this.devicesLoading.set(true);
    this.devicesError.set(undefined);
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    const requestUrl = `${this.apiConfig.getBaseUrl()}/api/v1/devices`;
    this.http.get<any[]>(requestUrl, { headers }).subscribe({
      next: (res:any)=>{
        const items = Array.isArray(res) ? res : (res?.items || res?.data || res?.results || []);
        this.devices.set(items);
        this.debugApiResponses.devicesList = {
          timestamp: new Date().toISOString(),
          requestUrl,
          requestHeaders: { ...headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {}) },
          rawResponse: res,
          count: items?.length ?? 0
        };
      },
      error: (err:any)=>{
        this.devicesError.set(err?.error?.title || err?.message || 'Failed to load devices');
        this.debugApiResponses.devicesList = {
          timestamp: new Date().toISOString(),
          requestUrl,
          error: err
        };
      }
    }).add(()=> this.devicesLoading.set(false));
  }

  loadProductionLines(){
    this.productionLinesLoading.set(true);
    this.productionLinesError.set(undefined);
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    const requestUrl = `${this.apiConfig.getBaseUrl()}/api/v1/production-lines`;
    this.http.get<any[]>(requestUrl, { headers }).subscribe({
      next: (res:any)=>{
        const items = Array.isArray(res) ? res : (res?.items || res?.data || res?.results || []);
        this.productionLines.set(items);
        this.debugApiResponses.productionLinesList = {
          timestamp: new Date().toISOString(),
          requestUrl,
          requestHeaders: { ...headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {}) },
          rawResponse: res,
          count: items?.length ?? 0
        };
      },
      error: (err:any)=>{
        this.productionLinesError.set(err?.error?.title || err?.message || 'Failed to load production lines');
        this.debugApiResponses.productionLinesList = {
          timestamp: new Date().toISOString(),
          requestUrl,
          error: err
        };
      }
    }).add(()=> this.productionLinesLoading.set(false));
  }

  // Helper to calculate total pages (estimated based on current results)
  canShowNextPage(): boolean {
    const params = this.searchParams();
    const pageSize = params.take || 10;
    return this.articles().length >= pageSize;
  }

  // Navigation methods
  goToCreatePage() {
    // Ensure no overlays are blocking interactions
    this.closeAllOverlays();
    this.resetNewArticleForm();
    this.apiResponse.set({ type: null, message: '' });
    this.currentView.set('create');
  // Reset raw buffer
  this.unitPriceInput.set('0');
  this.rawTextFieldNumbersCreate = {};
  this.rawNewArticleFields = {};
  this.rawTextFieldTextsCreate = {};
  }

  goToListPage() {
    this.currentView.set('list');
    this.apiResponse.set({ type: null, message: '' });
  }

  // Sub-page navigation helpers
  goToArticlesSubPage(){
    this.currentSubPage.set('articles');
  this.activeDebugTab = 'listArticles';
    // Ensure an articles view is active
    if(['create','edit','copy','list'].indexOf(this.currentView())===-1){
      this.currentView.set('list');
    }
  }
  goToStaticTextsSubPage(){
    this.currentSubPage.set('static-texts');
  this.activeDebugTab = 'stList';
    // Collapse any article modals to base view when switching
    this.currentView.set('list');
    // Load first page of existing static texts when entering tab
    if (!this.stListLoadedOnce) {
      this.loadStaticTextsList(1);
      this.stListLoadedOnce = true;
    }
  }

  // New empty sub-pages
  goToCustomersSubPage(){
    this.currentSubPage.set('customers');
    this.currentView.set('list');
  // Focus the only kept debug panel
  this.activeDebugTab = 'createCustomer';
  }
  goToDevicesSubPage(){
    this.currentSubPage.set('devices');
    this.currentView.set('list');
  this.activeDebugTab = 'devicesList';
  // Lazy load devices and production lines once
  if (!this.devicesLoadedOnce) { this.loadDevices(); this.devicesLoadedOnce = true; }
  if (!this.productionLinesLoadedOnce) { this.loadProductionLines(); this.productionLinesLoadedOnce = true; }
  }

  goToExceptionsSubPage(){
    this.currentSubPage.set('exceptions');
    this.currentView.set('list');
  this.activeDebugTab = 'exPut';
  }

  goToDeviceParametersSubPage(){
    // Temporarily disabled: backend not ready; ignore navigation
    // this.currentSubPage.set('device-parameters');
    // this.currentView.set('list');
    // this.activeDebugTab = 'devicesList';
  }

  // Exceptions modal dialog state
  exceptionsModalOpen = signal(false);
  openExceptionsModal(){ this.exceptionsModalOpen.set(true); document.body.classList.add('has-import-open'); }
  closeExceptionsModal(){ this.exceptionsModalOpen.set(false); document.body.classList.remove('has-import-open'); }

  // ---------------- Customers: Modal Form State ----------------
  customerModalOpen = signal(false);
  customerForm = signal<any>({
    customerNumber: '1',
    customerName: 'John Doe',
    title: 'Mr.',
    firstName: 'John',
    lastName: 'Doe',
    eMailAddress: 'mail@john-doe.com',
    phoneNumber1: '555-0100',
    phoneNumber2: '555-0100',
    mobilePhoneNumber: '555-0100',
    faxNumber: '555-0100',
    priceLevel: 'none',
    discountInPercent: 25,
    vat: 'US123456789',
    eori: 'US123456789012345',
    commonText1: 'Some additional text',
    commonText2: 'Some more additional text',
    commonNumber1: 123,
    commonNumber2: 456,
    additional1: 'Detailed information about the customer',
    additional2: 'More detailed information about the customer',
    assignedArticlesCsv: '1',
    // Address fields for one address
    addr_name1: 'John',
    addr_name2: 'Doe',
    addr_name3: 'Jr.',
    addr_houseNumber: '123',
    addr_street1: 'Maple Street',
    addr_street2: 'Maple Street',
    addr_postOfficeBox: '1032',
    addr_city: 'Anytown',
    addr_zipCode: '17101',
    addr_stateCode: 'PA',
    addr_country: 'US',
    addr_type: 'billingAddress',
    addr_isDefault: true,
    addr_isMainAddress: true
  });
  openAddCustomerModal(){ this.customerModalOpen.set(true); try{ document.body.classList.add('has-import-open'); }catch{} }
  closeAddCustomerModal(){ this.customerModalOpen.set(false); try{ document.body.classList.remove('has-import-open'); }catch{} }

  // Customer form field helpers for template bindings
  updateCustomerText(key: string, ev: Event){
    const val = (ev.target as HTMLInputElement)?.value ?? '';
    this.customerForm.update(f => ({ ...f, [key]: val }));
  }
  updateCustomerNumber(key: string, ev: Event){
    const raw = (ev.target as HTMLInputElement)?.value;
    const num = raw === '' || raw == null ? undefined : +raw;
    this.customerForm.update(f => ({ ...f, [key]: num }));
  }
  updateCustomerChecked(key: string, ev: Event){
    const checked = (ev.target as HTMLInputElement)?.checked ?? false;
    this.customerForm.update(f => ({ ...f, [key]: checked }));
  }

  // Customers: add example customer via POST
  addCustomer(){
    const url = `${this.apiConfig.getBaseUrl()}/api/v1/customers`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.auth.getToken()}`,
      'Content-Type': 'application/json'
    });
    const f = this.customerForm();
    // minimal validation
    if(!f.customerNumber || !f.customerName){
      this.apiResponse.set({ type:'error', message:'Customer Number and Name are required.', timestamp:new Date().toISOString() });
      this.activeDebugTab = 'createCustomer';
      try{ this.jsonCollapsed.set(false); }catch{}
      return;
    }
    const assignedArticles = String(f.assignedArticlesCsv || '')
      .split(',')
      .map((s:string)=>s.trim())
      .filter((s:string)=>!!s)
      .map((articleNumber:string)=>({ articleNumber }));
    const payload = {
      customerNumber: String(f.customerNumber),
      customerName: String(f.customerName),
      title: f.title ?? '',
      firstName: f.firstName ?? '',
      lastName: f.lastName ?? '',
      eMailAddress: f.eMailAddress ?? '',
      phoneNumber1: f.phoneNumber1 ?? '',
      phoneNumber2: f.phoneNumber2 ?? '',
      mobilePhoneNumber: f.mobilePhoneNumber ?? '',
      faxNumber: f.faxNumber ?? '',
      priceLevel: f.priceLevel ?? 'none',
      discountInPercent: Number(f.discountInPercent ?? 0),
      vat: f.vat ?? '',
      eori: f.eori ?? '',
      commonText1: f.commonText1 ?? '',
      commonText2: f.commonText2 ?? '',
      commonNumber1: Number(f.commonNumber1 ?? 0),
      commonNumber2: Number(f.commonNumber2 ?? 0),
      additional1: f.additional1 ?? '',
      additional2: f.additional2 ?? '',
      assignedArticles: assignedArticles.length ? assignedArticles : [{ articleNumber: '1' }],
      addresses: [
        {
          name1: f.addr_name1 ?? '',
          name2: f.addr_name2 ?? '',
          name3: f.addr_name3 ?? '',
          houseNumber: f.addr_houseNumber ?? '',
          street1: f.addr_street1 ?? '',
          street2: f.addr_street2 ?? '',
          postOfficeBox: f.addr_postOfficeBox ?? '',
          city: f.addr_city ?? '',
          zipCode: f.addr_zipCode ?? '',
          stateCode: f.addr_stateCode ?? '',
          country: f.addr_country ?? '',
          type: f.addr_type ?? 'billingAddress',
          isDefault: !!f.addr_isDefault,
          isMainAddress: !!f.addr_isMainAddress
        }
      ]
    };
  this.isLoading.set(true);
    this.apiResponse.set({ type: null, message: '' });
  // Focus debug panel on Create Customer and expand
  this.activeDebugTab = 'createCustomer';
  try { this.jsonCollapsed.set(false); } catch {}
    this.http.post(url, payload, { headers })
      .subscribe({
        next: (res:any)=>{
          // Debug info for Create Customer
          this.debugApiResponses.createCustomer = {
            timestamp: new Date().toISOString(),
            requestUrl: url,
            requestHeaders: { ...headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {}) },
            requestBody: payload,
            rawResponse: res
          };
          this.apiResponse.set({ type:'success', message:`Customer ${payload.customerNumber} created`, timestamp:new Date().toISOString() });
        },
        error: (err:any)=>{
          const msg = err?.error?.title || err?.error?.message || 'Failed to create customer';
          // Debug info with error
          this.debugApiResponses.createCustomer = {
            timestamp: new Date().toISOString(),
            requestUrl: url,
            requestHeaders: { ...headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {}) },
            requestBody: payload,
            error: err
          };
          this.apiResponse.set({ type:'error', message: msg, timestamp:new Date().toISOString() });
        }
  }).add(()=> { this.isLoading.set(false); this.closeAddCustomerModal(); });
  }

  // ---------------- Customers CSV Import ----------------
  cuImportState = signal<{open:boolean; step:'select'|'mapping'|'preview'|'running'|'done'}>({open:false, step:'select'});
  cuImportHeaders = signal<string[]>([]);
  cuImportMapping = signal<{[csvHeader:string]: string}>({});
  cuImportRawRows = signal<any[]>([]);
  cuImportRows = signal<any[]>([]);
  cuImportProgress = signal<{processed:number; success:number; created:number; updated:number; failed:number; percent:number; done:boolean}>({processed:0, success:0, created:0, updated:0, failed:0, percent:0, done:false});
  private cuImportCancelled = false; private cuImportConcurrency = 3; private cuActiveImports = 0; private cuImportQueueIndex = 0;
  private cuImportFieldDefinitions: Array<{key:string; label:string; required?:boolean; synonyms:string[]}> = [
    { key:'customerNumber', label:'Customer Number', required:true, synonyms:['customernumber','number','customer no','customer id','customerid'] },
    { key:'customerName', label:'Customer Name', required:true, synonyms:['customername','name','full name'] },
    { key:'title', label:'Title', synonyms:['title'] },
    { key:'firstName', label:'First Name', synonyms:['firstname','first name','givenname','given name'] },
    { key:'lastName', label:'Last Name', synonyms:['lastname','last name','surname','familyname','family name'] },
    { key:'eMailAddress', label:'Email', synonyms:['email','e-mail','mail','emailaddress','e-mail address'] },
    { key:'phoneNumber1', label:'Phone 1', synonyms:['phone1','phone','phone number','telephone'] },
    { key:'phoneNumber2', label:'Phone 2', synonyms:['phone2','phone number 2','telephone2'] },
    { key:'mobilePhoneNumber', label:'Mobile', synonyms:['mobile','mobilephone','cell','cellphone'] },
    { key:'faxNumber', label:'Fax', synonyms:['fax','faxnumber'] },
    { key:'priceLevel', label:'Price Level', synonyms:['pricelevel'] },
    { key:'discountInPercent', label:'Discount %', synonyms:['discount','discountpercent','discount%'] },
    { key:'vat', label:'VAT', synonyms:['vat','vatid','vat number'] },
    { key:'eori', label:'EORI', synonyms:['eori'] },
    { key:'commonText1', label:'Common Text 1', synonyms:['commontext1'] },
    { key:'commonText2', label:'Common Text 2', synonyms:['commontext2'] },
    { key:'commonNumber1', label:'Common Number 1', synonyms:['commonnumber1'] },
    { key:'commonNumber2', label:'Common Number 2', synonyms:['commonnumber2'] },
    { key:'additional1', label:'Additional 1', synonyms:['additional1','note1'] },
    { key:'additional2', label:'Additional 2', synonyms:['additional2','note2'] },
    { key:'assignedArticlesCsv', label:'Assigned Articles (CSV)', synonyms:['assignedarticles','articles','articlelist'] },
    // Address fields
    { key:'addr_name1', label:'Address Name 1', synonyms:['name1','address name1','addrname1'] },
    { key:'addr_name2', label:'Address Name 2', synonyms:['name2','address name2','addrname2'] },
    { key:'addr_name3', label:'Address Name 3', synonyms:['name3','address name3','addrname3'] },
    { key:'addr_houseNumber', label:'House Number', synonyms:['housenumber','house no','house'] },
    { key:'addr_street1', label:'Street 1', synonyms:['street1','street','address1','line1'] },
    { key:'addr_street2', label:'Street 2', synonyms:['street2','address2','line2'] },
    { key:'addr_postOfficeBox', label:'PO Box', synonyms:['pobox','postofficebox','po box'] },
    { key:'addr_city', label:'City', synonyms:['city','town'] },
    { key:'addr_zipCode', label:'ZIP', synonyms:['zip','zipcode','postalcode','post code'] },
    { key:'addr_stateCode', label:'State Code', synonyms:['state','statecode','region','province'] },
    { key:'addr_country', label:'Country', synonyms:['country','countrycode'] },
    { key:'addr_type', label:'Address Type', synonyms:['type','addresstype'] },
    { key:'addr_isDefault', label:'Is Default', synonyms:['default','isdefault'] },
    { key:'addr_isMainAddress', label:'Is Main', synonyms:['main','ismain','mainaddress'] },
  ];
  get cuImportFieldDefs(){ return this.cuImportFieldDefinitions; }
  cuOpenImportDialog(){ this.cuImportState.set({open:true, step:'select'}); this.cuImportHeaders.set([]); this.cuImportMapping.set({}); this.cuImportRows.set([]); this.cuImportRawRows.set([]); document.body.classList.add('has-import-open'); }
  cuCloseImportDialog(){ if(this.cuImportState().step==='running' && !this.cuImportProgress().done){ this.cuImportCancelled=true; } this.cuImportState.set({open:false, step:'select'}); document.body.classList.remove('has-import-open'); }
  cuDownloadImportTemplate(){
    // Full template using all fields supported by import -> matches API payload shape (flattened for CSV)
    const header = [
      'customerNumber','customerName','title','firstName','lastName','eMailAddress','phoneNumber1','phoneNumber2','mobilePhoneNumber','faxNumber',
      'priceLevel','discountInPercent','vat','eori','commonText1','commonText2','commonNumber1','commonNumber2','additional1','additional2',
      // Assigned articles as comma-separated values
      'assignedArticlesCsv',
      // Single address fields (first/default address)
      'addr_name1','addr_name2','addr_name3','addr_houseNumber','addr_street1','addr_street2','addr_postOfficeBox','addr_city','addr_zipCode','addr_stateCode','addr_country','addr_type','addr_isDefault','addr_isMainAddress'
    ];
    const row1 = [
      '1001','John Doe','Mr.','John','Doe','mail@john-doe.com','555‑0100','555‑0100','555‑0100','555‑0100',
      'none','0','','US123456789012345','Some additional text','Some more additional text','123','456','Detailed information about the customer','More detailed information about the customer',
      '11',
      'John','Doe','Jr.','123','Maple Street','Maple Street','1032','Reading','17101','PA','US','billingAddress','true','true'
    ];
    const row2 = [
      '1002','Jane Smith','Ms.','Jane','Smith','jane@smith.test','555‑0102','','555‑0199','',
      'retail','5','US-VAT-1002','EU9988776655','VIP customer','','0','0','Preferred customer','',
      '1,2,3',
      'Jane','','','42','Oak Ave','','','Springfield','01101','MA','US','shippingAddress','true','false'
    ];
    const escape = (v:any)=>{
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
    };
    const csv = [header.join(','), row1.map(escape).join(','), row2.map(escape).join(',')].join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Customers-Import-Template-${new Date().toISOString().substring(0,10)}.csv`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  }
  async onCuImportFileSelected(event: Event){
    const input = event.target as HTMLInputElement; const file = input.files && input.files[0]; if(!file) return;
    try {
      const { rawRows, headers } = await parseCsvFile(file, 5000);
      this.cuImportRawRows.set(rawRows);
      this.cuImportHeaders.set(headers);
      this.cuAutoMapImportHeaders();
      this.cuRebuildMappedRows();
      this.cuImportState.set({open:true, step:'mapping'});
    } catch {
      this.error.set('Failed to parse CSV');
    }
  }
  cuAutoMapImportHeaders(){
  const headers = this.cuImportHeaders();
  const mapping = autoMapHeaders(headers, this.cuImportFieldDefinitions, this.cuImportMapping());
  this.cuImportMapping.set(enforceUniqueMapping(mapping));
  }
  cuUpdateImportMapping(csvHeader:string, target:string){ const m={...this.cuImportMapping()}; if(!target) delete m[csvHeader]; else m[csvHeader]=target; const reversed:any={}; for(const [h,t] of Object.entries(m)){ if(reversed[t] && reversed[t]!==h){ delete m[reversed[t]]; } reversed[t]=h; } this.cuImportMapping.set(m); this.cuRebuildMappedRows(); }
  private cuRebuildMappedRows(){ const raw=this.cuImportRawRows(); const rows=raw.map((r:any,i:number)=> this.cuMapImportRow(r,i+2)); this.cuImportRows.set(rows); }
  cuRequiredImportFieldsMapped(){ const mapped = new Set(Object.values(this.cuImportMapping())); return ['customerNumber','customerName'].every(k=> mapped.has(k)); }
  cuGoToPreviewFromMapping(){ if(this.cuRequiredImportFieldsMapped()) this.cuImportState.set({open:true, step:'preview'}); }
  cuBackToMapping(){ if(this.cuImportState().step==='preview') this.cuImportState.set({open:true, step:'mapping'}); }
  private cuMapImportRow(r:any,line:number){
    const mapping = this.cuImportMapping(); const get=(k:string)=>{ const h=Object.entries(mapping).find(([,t])=>t===k)?.[0]; return h? r[h]:''; };
    const row:any = {
  original:r, line,
  customerNumber: trimValue(get('customerNumber')||r.customerNumber||r.number),
  customerName: trimValue(get('customerName')||r.customerName||r.name),
  title: trimValue(get('title')||r.title),
  firstName: trimValue(get('firstName')||r.firstName),
  lastName: trimValue(get('lastName')||r.lastName),
  eMailAddress: trimValue(get('eMailAddress')||r.eMailAddress||r.email),
  phoneNumber1: trimValue(get('phoneNumber1')||r.phoneNumber1||r.phone),
  phoneNumber2: trimValue(get('phoneNumber2')||r.phoneNumber2),
  mobilePhoneNumber: trimValue(get('mobilePhoneNumber')||r.mobilePhoneNumber||r.mobile),
  faxNumber: trimValue(get('faxNumber')||r.faxNumber||r.fax),
  priceLevel: trimValue(get('priceLevel')||r.priceLevel),
  discountInPercent: parseNumberValue(get('discountInPercent')||r.discountInPercent||r.discount),
  vat: trimValue(get('vat')||r.vat),
  eori: trimValue(get('eori')||r.eori),
  commonText1: trimValue(get('commonText1')||r.commonText1),
  commonText2: trimValue(get('commonText2')||r.commonText2),
  commonNumber1: parseNumberValue(get('commonNumber1')||r.commonNumber1),
  commonNumber2: parseNumberValue(get('commonNumber2')||r.commonNumber2),
  additional1: trimValue(get('additional1')||r.additional1),
  additional2: trimValue(get('additional2')||r.additional2),
  assignedArticlesCsv: trimValue(get('assignedArticlesCsv')||r.assignedArticlesCsv||r.assignedArticles||r.articles),
  addr_name1: trimValue(get('addr_name1')||r.addr_name1||r.name1),
  addr_name2: trimValue(get('addr_name2')||r.addr_name2||r.name2),
  addr_name3: trimValue(get('addr_name3')||r.addr_name3||r.name3),
  addr_houseNumber: trimValue(get('addr_houseNumber')||r.addr_houseNumber||r.houseNumber||r.house),
  addr_street1: trimValue(get('addr_street1')||r.addr_street1||r.street1||r.street),
  addr_street2: trimValue(get('addr_street2')||r.addr_street2||r.street2),
  addr_postOfficeBox: trimValue(get('addr_postOfficeBox')||r.addr_postOfficeBox||r.poBox||r.pobox),
  addr_city: trimValue(get('addr_city')||r.addr_city||r.city),
  addr_zipCode: trimValue(get('addr_zipCode')||r.addr_zipCode||r.zip||r.zipCode||r.postalCode),
  addr_stateCode: trimValue(get('addr_stateCode')||r.addr_stateCode||r.state||r.stateCode),
  addr_country: trimValue(get('addr_country')||r.addr_country||r.country||r.countryCode),
  addr_type: trimValue(get('addr_type')||r.addr_type||r.type||'billingAddress'),
  addr_isDefault: parseBoolValue(get('addr_isDefault')||r.addr_isDefault||r.default),
  addr_isMainAddress: parseBoolValue(get('addr_isMainAddress')||r.addr_isMainAddress||r.main) ,
      status:'', error:''
    };
    if(!row.customerNumber || row.customerNumber.length>32) row.error += 'invalid number; ';
    if(!row.customerName || row.customerName.length>128) row.error += 'invalid name; ';
    return row;
  }
  cuInvalidImportRowCount(){ return this.cuImportRows().filter(r=>r.error).length; }
  cuStartImport(){
    this.cuImportCancelled=false;
    this.cuImportProgress.set({processed:0, success:0, created:0, updated:0, failed:0, percent:0, done:false});
    const rows=this.cuImportRows().filter(r=>!r.error);
    this.cuImportRows.set(rows);
    this.cuImportState.set({open:true, step:'running'});
    runConcurrentQueue(rows, (row)=> this.cuProcessImportRow(row).then(()=> this.sleep(200)), {
      concurrency: 1,
      getCancelled: () => this.cuImportCancelled,
      onItemDone: () => this.cuUpdateImportProgress(),
      onDone: () => { /* handled in cuUpdateImportProgress */ }
    });
  }
  cuCancelImport(){ this.cuImportCancelled=true; }
  private cuPumpImportQueue(){ /* replaced by runConcurrentQueue */ }
  private async cuProcessImportRow(row:any){
    try{
      const assignedArticles = String(row.assignedArticlesCsv || '').split(',').map((s:string)=>s.trim()).filter(Boolean).map((articleNumber:string)=>({ articleNumber }));
      const payload:any = {
        customerNumber: String(row.customerNumber), customerName: String(row.customerName), title: row.title||'', firstName: row.firstName||'', lastName: row.lastName||'', eMailAddress: row.eMailAddress||'', phoneNumber1: row.phoneNumber1||'', phoneNumber2: row.phoneNumber2||'', mobilePhoneNumber: row.mobilePhoneNumber||'', faxNumber: row.faxNumber||'', priceLevel: row.priceLevel||'none', discountInPercent: Number(row.discountInPercent||0), vat: row.vat||'', eori: row.eori||'', commonText1: row.commonText1||'', commonText2: row.commonText2||'', commonNumber1: Number(row.commonNumber1||0), commonNumber2: Number(row.commonNumber2||0), additional1: row.additional1||'', additional2: row.additional2||'', assignedArticles,
        addresses:[{ name1: row.addr_name1||'', name2: row.addr_name2||'', name3: row.addr_name3||'', houseNumber: row.addr_houseNumber||'', street1: row.addr_street1||'', street2: row.addr_street2||'', postOfficeBox: row.addr_postOfficeBox||'', city: row.addr_city||'', zipCode: row.addr_zipCode||'', stateCode: row.addr_stateCode||'', country: row.addr_country||'', type: row.addr_type||'billingAddress', isDefault: !!row.addr_isDefault, isMainAddress: !!row.addr_isMainAddress }]
      };
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}`, 'Content-Type':'application/json' });
      // Check existence
      let exists=false; try{ await this.http.get(`${this.apiConfig.getBaseUrl()}/api/v1/customers/${encodeURIComponent(payload.customerNumber)}`, { headers }).toPromise(); exists=true; }catch{ exists=false; }
      if(!exists){ await this.http.post(`${this.apiConfig.getBaseUrl()}/api/v1/customers`, payload, { headers }).toPromise(); row.status='created'; }
      else { await this.http.put(`${this.apiConfig.getBaseUrl()}/api/v1/customers/${encodeURIComponent(payload.customerNumber)}`, payload, { headers }).toPromise(); row.status='updated'; }
    }catch(e:any){
      row.status='failed';
      row.error = e?.error?.title || e?.message || 'error';
      // While import fails, clear Create Customer debug panel to keep only relevant info per request
      try { this.debugApiResponses.createCustomer = null; } catch {}
    }
  }
  private cuUpdateImportProgress(){ const rows=this.cuImportRows(); const processed=rows.filter(r=>r.status).length; const created=rows.filter(r=>r.status==='created').length; const updated=rows.filter(r=>r.status==='updated').length; const success=created+updated; const failed=rows.filter(r=>r.status==='failed').length; const percent=rows.length? Math.round(processed*100/rows.length):0; const done=processed===rows.length || this.cuImportCancelled; this.cuImportProgress.set({processed, success, created, updated, failed, percent, done}); if(done) this.cuFinishImport(); }
  private cuFinishImport(){ this.cuImportState.set({open:true, step:'done'}); }
  cuDownloadImportErrors(){ const errs=this.cuImportRows().filter(r=>r.status==='failed'); if(!errs.length) return; const header='line,customerNumber,customerName,error\n'; const body=errs.map(r=>`${r.line},"${r.customerNumber}","${(r.customerName||'').replace(/"/g,'""')}","${(r.error||'').replace(/"/g,'""')}"`).join('\n'); const blob=new Blob([header+body],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='customers-import-errors.csv'; a.click(); URL.revokeObjectURL(url); }
  // Static Text handlers (placeholder logic)
  updateStaticTextNumber(ev: Event){
    const val = +(ev.target as HTMLInputElement).value;
    this.staticTextData.update(s=>({...s, number: val}));
  this.staticTextDirty.set(true);
  }
  updateStaticTextDescription(ev: Event){
    const val = (ev.target as HTMLInputElement).value;
    this.staticTextData.update(s=>({...s, description: val}));
  this.staticTextDirty.set(true);
  }
  toggleStaticTextItemSend(item: StaticTextItem){
    this.staticTextData.update(s=>({
      ...s,
      items: s.items.map(it=>it.number===item.number?{...it, sendFormat:!it.sendFormat}:it)
    }));
  this.staticTextDirty.set(true);
  }
  updateStaticTextItemValue(item: StaticTextItem, ev: Event){
  const val = (ev.target as HTMLInputElement).value || '';
    // Only update state if changed to reduce re-render cost
    if(item.textValue === val) return;
    this.staticTextData.update(s=>({
      ...s,
      items: s.items.map(it=> it.number===item.number ? {...it, textValue: val} : it)
    }));
  this.staticTextDirty.set(true);
  }
  trackStaticTextItem(index:number, item: StaticTextItem){ return item.number; }
  createStaticText(){
    const payload = {
      number: this.staticTextData().number,
      description: this.staticTextData().description,
      items: this.staticTextData().items.map(it=>({
        number: it.number,
        textValue: it.textValue,
        sendFormat: it.sendFormat
      }))
    };
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.auth.getToken()}`,
      'Content-Type': 'application/json'
    });
    this.isLoading.set(true);
    this.apiResponse.set({ type: null, message: '' });
    const requestUrl = `${this.apiConfig.getBaseUrl()}/extensions/api/StaticTexts/CreateAndUpdateStaticText`;
  this.http.post(requestUrl, payload, { headers })
      .subscribe({
        next: (res:any)=>{
          this.apiResponse.set({type:'success', message:`Static Text ${payload.number} saved`, timestamp:new Date().toISOString()});
      this.staticTextDirty.set(false);
          // debug log
          this.debugApiResponses.stCreateOrUpdate = {
            timestamp: new Date().toISOString(),
            requestUrl,
            requestHeaders: { ...headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {}) },
            requestBody: payload,
            rawResponse: res
          };
        },
        error: (err:any)=>{
          const msg = err?.error?.title || err?.error?.message || 'Failed to save static text';
          this.apiResponse.set({type:'error', message: msg, timestamp:new Date().toISOString()});
          // debug error
          this.debugApiResponses.stCreateOrUpdate = {
            timestamp: new Date().toISOString(),
            requestUrl,
            requestBody: payload,
            error: err
          };
        }
      }).add(()=> this.isLoading.set(false));
  }
  resetStaticTextForm(){
    this.staticTextData.set({
      number: 1001,
      description: '',
    items: Array.from({length:50},(_,i)=>({number:i+1,textValue:'',sendFormat:false,fontClass:'overlay-text-regular'}))
    });
    this.staticTextDirty.set(false);
  }

  // -------- Static Texts listing (with pagination) --------
  stListItems = signal<any[]>([]);
  stListPage = signal(1);
  stListPageSize = signal(10);
  stListTotal = signal<number|undefined>(undefined);
  stListLoading = signal(false);
  stListError = signal<string|undefined>(undefined);
  // Client-side view helpers: filter by number and sort by number
  stFilterNumber = signal<string>('');
  stSortDir = signal<'asc'|'desc'>('asc');
  private stListLoadedOnce = false;

  loadStaticTextsList(page?: number){
    const targetPage = page ?? this.stListPage();
    const pageSize = this.stListPageSize();
    this.stListLoading.set(true);
    this.stListError.set(undefined);
    this.stListPage.set(targetPage);
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.auth.getToken()}` });
    const params = { page: String(targetPage), pageSize: String(pageSize) } as any;
    const requestUrl = `${this.apiConfig.getBaseUrl()}/extensions/api/StaticTexts/GetAllStaticTexts`;
  this.http.get(requestUrl, { headers, params })
      .subscribe({
        next: (res: any) => {
          // Support a few common shapes: array, {items,total}, {data,totalCount}
          const items = Array.isArray(res) ? res : (res?.items || res?.data || res?.results || []);
          const total = (res?.total ?? res?.totalCount ?? res?.count);
          this.stListItems.set(items);
          this.stListTotal.set(typeof total === 'number' ? total : undefined);
          // debug log
          this.debugApiResponses.stList = {
            timestamp: new Date().toISOString(),
            requestUrl,
            requestHeaders: { ...headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {}) },
            requestParams: params,
            rawResponse: res,
            itemsCount: items?.length ?? 0,
            total
          };
        },
        error: (err:any) => {
          const msg = err?.error?.title || err?.message || 'Failed to load static texts';
          this.stListError.set(msg);
          // debug error
          this.debugApiResponses.stList = {
            timestamp: new Date().toISOString(),
            requestUrl,
            requestParams: params,
            error: err
          };
        }
      }).add(()=> this.stListLoading.set(false));
  }

  stChangePageSize(size:number){
    this.stListPageSize.set(size);
    this.loadStaticTextsList(1);
  }

  stHasPrev(){ return this.stListPage() > 1; }
  stHasNext(){
    const total = this.stListTotal();
    if (typeof total === 'number') return this.stListPage() * this.stListPageSize() < total;
    // Fallback: if current page returned a full page of items, assume there may be a next page
    return this.stListItems().length === this.stListPageSize();
  }
  stPrevPage(){ if(this.stHasPrev()) this.loadStaticTextsList(this.stListPage() - 1); }
  stNextPage(){ if(this.stHasNext()) this.loadStaticTextsList(this.stListPage() + 1); }
  stTotalPages(){ const total=this.stListTotal(); return typeof total==='number' ? Math.max(1, Math.ceil(total/ this.stListPageSize())) : undefined; }

  // Derived view items applying filter/sort on the current page
  stViewItems(): any[] {
    const filter = (this.stFilterNumber() || '').trim();
    const dir = this.stSortDir();
    const src = this.stListItems() || [];
    let items = src;
    if (filter) {
      items = items.filter((it:any)=> String(it?.number ?? it?.id ?? '').includes(filter));
    }
    items = [...items].sort((a:any,b:any)=> {
      const an = Number(a?.number ?? a?.id ?? 0);
      const bn = Number(b?.number ?? b?.id ?? 0);
      return dir === 'asc' ? an - bn : bn - an;
    });
    return items;
  }

  stSetFilterNumber(val: string){
    this.stFilterNumber.set(val ?? '');
  }
  stToggleSortDir(){
    this.stSortDir.set(this.stSortDir()==='asc' ? 'desc' : 'asc');
  }

  // Extract text for item n from various possible result shapes
  stGetItemText(row:any, n:number): string {
    // Preferred: array of { number, textValue }
    const arr = row?.items;
    if (Array.isArray(arr)) {
      const hit = arr.find((x:any)=> (x?.number===n));
      if (hit && (hit.textValue ?? hit.value ?? hit.text)) return String(hit.textValue ?? hit.value ?? hit.text);
    }
    // Object with staticText1..staticText50 or staticText01..staticText50
    const st = row?.staticTexts || row?.StaticTexts || row;
    if (st && typeof st === 'object') {
      const k1 = `staticText${n}`;
      const k2 = `staticText${String(n).padStart(2,'0')}`;
      const k3 = `Text${n}`;
      const v = st[k1] ?? st[k2] ?? st[k3];
      if (v !== undefined && v !== null) return String(v);
    }
    return '';
  }

  // Populate the Add Static Text form from a selected list row
  stEditStaticText(row:any){
    const items = Array.from({length:50}, (_,i)=> ({
      number: i+1,
      textValue: this.stGetItemText(row, i+1) || '',
      sendFormat: false,
      fontClass: 'overlay-text-regular'
    }));
    const number = row?.number ?? row?.id ?? 0;
    const description = row?.description ?? row?.name ?? '';
    this.staticTextData.set({ number, description, items });
    // Mark dirty so Save is enabled; scroll to form
    this.staticTextDirty.set(true);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  }

  /**
   * Ensure no modal/overlay is left open that could block interaction
   * (delete confirm, import panels, exceptions/customer modals, body class).
   */
  private closeAllOverlays() {
    // Best-effort: don't throw if running in SSR or DOM not available
    try { document.body.classList.remove('has-import-open'); } catch {}

    // Close confirm overlay
    try { this.showDeleteConfirm.set(false); } catch {}

    // Close inline modals/panels
    try { this.exceptionsModalOpen.set(false); } catch {}
    try { this.customerModalOpen.set(false); } catch {}

    // Reset import states (articles, static texts, exceptions, customers)
    try { this.importState.set({ open: false, step: 'select' }); } catch {}
    try { this.stImportState.set({ open: false, step: 'select' }); } catch {}
    try { this.exImportState.set({ open: false, step: 'select' }); } catch {}
    try { this.cuImportState.set({ open: false, step: 'select' }); } catch {}
  }

  goToEditPage(article: LabelerArticle) {
    // Proactively close any overlays that might intercept input
    this.closeAllOverlays();
    // Reset raw input buffers to avoid stale values
    this.rawEditFields = {};
    this.rawTextFieldNumbersEdit = {};
    this.rawTextFieldTextsEdit = {};
    this.selectedArticle.set({ ...article });
    this.apiResponse.set({ type: null, message: '' });
    this.currentView.set('edit');
  }

  async goToCopyPage(article: LabelerArticle) {
    // Close any overlays first to avoid pointer-event blockers
    this.closeAllOverlays();
    // First fetch the complete article data using the GET endpoint
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.auth.getToken()}`
      });

  const requestUrl = `${this.apiConfig.getBaseUrl()}/api/v1/articles/${encodeURIComponent(article.number)}/labeler`;
      const fullArticle = await this.http.get<LabelerArticle>(requestUrl, { headers }).toPromise();
      
      if (fullArticle) {
        // Create a copy with empty number (to force user to enter new PLU number)
        const copyArticle = { 
          ...fullArticle,
          number: '', // Force user to enter new PLU number
          name: fullArticle.name + ' (Copy)', // Suggest it's a copy
        };
        
        // Reset raw input buffers for copy view as well
        this.rawEditFields = {};
        this.rawTextFieldNumbersEdit = {};
        this.rawTextFieldTextsEdit = {};
        this.selectedArticle.set(copyArticle);
        this.apiResponse.set({ type: null, message: '' });
        this.currentView.set('copy');
      }
    } catch (error: any) {
      console.error('Error fetching article for copy:', error);
      this.error.set(error?.error?.title || 'Failed to fetch article data for copying');
      this.apiResponse.set({
        type: 'error',
        message: error?.error?.title || 'Failed to fetch article data for copying',
        timestamp: new Date().toISOString()
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  // Backwards compatibility methods (previous modal triggers)
  openCreateModal() { this.goToCreatePage(); }
  closeCreateModal() { this.goToListPage(); }
  openEditModal(article: LabelerArticle) { this.goToEditPage(article); }
  closeEditModal() { this.goToListPage(); }
  openCopyModal(article: LabelerArticle) { this.goToCopyPage(article); }
  closeCopyModal() { this.goToListPage(); }

  openDeleteConfirm(article: LabelerArticle) {
    this.selectedArticle.set(article);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm.set(false);
    this.selectedArticle.set(null);
  }

  // Helper methods
  private buildQueryString(params: ArticleSearchParams): string {
    const searchParams = new URLSearchParams();
    
    if (params.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params.take !== undefined) searchParams.append('take', params.take.toString());
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.articleName) searchParams.append('articleName', params.articleName);
    if (params.articleNumber) searchParams.append('articleNumber', params.articleNumber);
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  private createPatchOperations(article: LabelerArticle) {
    // Create JSON patch operations for all updatable fields
    const operations = [];
    
    // Top-level fields
    operations.push({ op: 'replace', path: '/isEnabledForLabelers', value: article.isEnabledForLabelers });
    operations.push({ op: 'replace', path: '/weightUnit', value: article.weightUnit });
    
    if (article.weightDecimalPlaces !== undefined) {
      operations.push({ op: 'replace', path: '/weightDecimalPlaces', value: article.weightDecimalPlaces });
    }
    if (article.name !== undefined) {
      operations.push({ op: 'replace', path: '/name', value: article.name });
    }
    if (article.description !== undefined) {
      operations.push({ op: 'replace', path: '/description', value: article.description });
    }
    if (article.active !== undefined) {
      operations.push({ op: 'replace', path: '/active', value: article.active });
    }
    if (article.approved !== undefined) {
      operations.push({ op: 'replace', path: '/approved', value: article.approved });
    }
    if (article.gxPriceCurrencyCode !== undefined) {
      operations.push({ op: 'replace', path: '/gxPriceCurrencyCode', value: article.gxPriceCurrencyCode });
    }
    if (article.isEnabledForGxCheckWeighers !== undefined) {
      operations.push({ op: 'replace', path: '/isEnabledForGxCheckWeighers', value: article.isEnabledForGxCheckWeighers });
    }
    if (article.gxPriceDecimalPlaces !== undefined) {
      operations.push({ op: 'replace', path: '/gxPriceDecimalPlaces', value: article.gxPriceDecimalPlaces });
    }
    if (article.additional1 !== undefined) {
      operations.push({ op: 'replace', path: '/additional1', value: article.additional1 });
    }
    if (article.additional2 !== undefined) {
      operations.push({ op: 'replace', path: '/additional2', value: article.additional2 });
    }
    if (article.commonText1 !== undefined) {
      operations.push({ op: 'replace', path: '/commonText1', value: article.commonText1 });
    }
    if (article.commonText2 !== undefined) {
      operations.push({ op: 'replace', path: '/commonText2', value: article.commonText2 });
    }
    if (article.commonNumber1 !== undefined) {
      operations.push({ op: 'replace', path: '/commonNumber1', value: article.commonNumber1 });
    }
    if (article.commonNumber2 !== undefined) {
      operations.push({ op: 'replace', path: '/commonNumber2', value: article.commonNumber2 });
    }

    // ArticlePLU nested fields
    if (article.articlePLU) {
      // Always ensure basePriceDivision is set to perUnit
      operations.push({ op: 'replace', path: '/articlePLU/basePriceDivision', value: 'perUnit' });
      
      // Text fields: only include if present (based on precedence during construction)
      for (let i = 1; i <= 20; i++) {
        const key = `textField${i}` as keyof ArticlePLU;
        const tf = article.articlePLU[key] as TextField | undefined;
        if (tf !== undefined) {
          operations.push({ op: 'replace', path: `/articlePLU/${key}/number`, value: tf.number });
          operations.push({ op: 'replace', path: `/articlePLU/${key}/text`, value: tf.text });
        }
      }

      // Date text fields: only include if present (based on precedence)
      for (let i = 1; i <= 3; i++) {
        const key = `dateTextField${i}` as keyof ArticlePLU;
        const df = article.articlePLU[key] as TextField | undefined;
        if (df !== undefined) {
          operations.push({ op: 'replace', path: `/articlePLU/${key}/number`, value: df.number });
          operations.push({ op: 'replace', path: `/articlePLU/${key}/text`, value: df.text });
        }
      }

      // Simple text fields
      for (let i = 1; i <= 30; i++) {
        const simpleTextKey = `simpleText${i}` as keyof ArticlePLU;
        const simpleText = article.articlePLU[simpleTextKey];
        if (simpleText !== undefined) {
          operations.push({ op: 'replace', path: `/articlePLU/${simpleTextKey}`, value: simpleText });
        }
      }

      // Code fields
      for (let i = 1; i <= 7; i++) {
        const codeFieldKey = `codeField${i}` as keyof ArticlePLU;
        const codeStringKey = `codeString${i}` as keyof ArticlePLU;
        
        if (article.articlePLU[codeFieldKey] !== undefined) {
          operations.push({ op: 'replace', path: `/articlePLU/${codeFieldKey}`, value: article.articlePLU[codeFieldKey] });
        }
        if (article.articlePLU[codeStringKey] !== undefined) {
          operations.push({ op: 'replace', path: `/articlePLU/${codeStringKey}`, value: article.articlePLU[codeStringKey] });
        }
      }

      // General numbers
      for (let i = 1; i <= 20; i++) {
        const generalNumberKey = `generalNumber${i}` as keyof ArticlePLU;
        if (article.articlePLU[generalNumberKey] !== undefined) {
          operations.push({ op: 'replace', path: `/articlePLU/${generalNumberKey}`, value: article.articlePLU[generalNumberKey] });
        }
      }

      // Logo fields
      for (let i = 1; i <= 10; i++) {
        const logoFieldKey = `logoField${i}` as keyof ArticlePLU;
        if (article.articlePLU[logoFieldKey] !== undefined) {
          operations.push({ op: 'replace', path: `/articlePLU/${logoFieldKey}`, value: article.articlePLU[logoFieldKey] });
        }
      }

      // Other PLU fields
      const pluFields = [
        'unitPriceValue', 'specialUnitPriceValue', 'recalculateUnitPriceType',
        'shelfLifeDays1', 'shelfLifeDays2', 'date1', 'date2', 'date3',
        'time1PrintConfiguration', 'time2PrintConfiguration',
        'tareWeightValue', 'fixedWeightValue', 'minWeightValue', 'maxWeightValue',
        'scannerCompulsory', 'scanningRule', 'labelScanningRule',
        'productGroupNumber', 'tendencyControl', 'staticText',
        'automaticLabelParameter', 'labelParameter', 'piecesPerPackage',
        'numberOfSuccessiveLabels', 'numberOfLabelCopies', 'labelingMode',
        'alternateLabelDataOutputChannel', 'alternateLabelCriteria', 'labelLanguage',
        'countrySecondCurrency', 'printConversionRate', 'template', 'weightClass',
        'heightOfPackage', 'packageLength', 'packageLengthTolerance',
        'metalDetectorProductNumber', 'productNumberLDI', 'productNumberLCE',
        'codepage', 'macroModeT', 'nutritionLabelEnabled', 'locationsEnabled',
        'tendencyRegulationEnabled', 'preselectionTotal'
      ];

      pluFields.forEach(field => {
        if (article.articlePLU && article.articlePLU[field as keyof ArticlePLU] !== undefined) {
          operations.push({ op: 'replace', path: `/articlePLU/${field}`, value: article.articlePLU[field as keyof ArticlePLU] });
        }
      });

      // Ingredients proportion
      if (article.articlePLU.ingredientsProportion) {
        operations.push({ op: 'replace', path: '/articlePLU/ingredientsProportion/value', value: article.articlePLU.ingredientsProportion.value });
        operations.push({ op: 'replace', path: '/articlePLU/ingredientsProportion/decimalPlaces', value: article.articlePLU.ingredientsProportion.decimalPlaces });
        operations.push({ op: 'replace', path: '/articlePLU/ingredientsProportion/unit', value: article.articlePLU.ingredientsProportion.unit });
      }

      // Print channel configurations
      const printChannels = [
        'printChannelInternalConfiguration', 'printChannelAConfiguration', 'printChannelBConfiguration',
        'printChannelCConfiguration', 'printChannelDConfiguration', 'printChannelEConfiguration',
        'printChannelFConfiguration', 'printChannelGConfiguration', 'printChannelHConfiguration',
        'printChannelIConfiguration', 'printChannelJConfiguration', 'printChannelKConfiguration'
      ];

      printChannels.forEach(channel => {
        if (article.articlePLU && article.articlePLU[channel as keyof ArticlePLU] !== undefined) {
          operations.push({ op: 'replace', path: `/articlePLU/${channel}`, value: article.articlePLU[channel as keyof ArticlePLU] });
        }
      });

      // Preselected values
      const preselectedFields = ['total1PreselectedValueForPiece', 'total2PreselectedValueForPiece', 'total3PreselectedValueForPiece'];
      preselectedFields.forEach(field => {
        if (article.articlePLU && article.articlePLU[field as keyof ArticlePLU] !== undefined) {
          operations.push({ op: 'replace', path: `/articlePLU/${field}`, value: article.articlePLU[field as keyof ArticlePLU] });
        }
      });
    }

    return operations;
  }

  private resetNewArticleForm() {
    this.newArticle.set({
      isEnabledForLabelers: true,
      weightUnit: 'lb',
      weightDecimalPlaces: 2,
      active: true,
      approved: false,
      number: '',
      name: '',
      description: ''
    });
  this.unitPriceInput.set('0');
    // Ensure PLU exists & labeling mode normalized
    this.newArticle.update(a => ({
      ...a,
      articlePLU: a.articlePLU ? { ...a.articlePLU, labelingMode: this.normalizeLabelingMode(a.articlePLU.labelingMode as string) } : this.createEmptyArticlePLU()
    }));
  this.rawTextFieldNumbersCreate = {};
  }

  // Navigation
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  // Helper methods
  getWeightUnitLabel(article: LabelerArticle | Partial<LabelerArticle> | null): string {
    if (!article) return '(kg)';
    
    const weightUnitMap: { [key: string]: string } = {
      'kg': '(kg)',
      'g': '(g)',
      'lb': '(lb)',
      'oz': '(oz)',
      'pounds': '(lb)',
      'grams': '(g)',
      'kilograms': '(kg)',
      'ounces': '(oz)'
    };
    
    return weightUnitMap[article.weightUnit?.toLowerCase() || ''] || `(${article.weightUnit || 'kg'})`;
  }

  // Form updates
  updateSearchArticleName(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchParams.update(params => ({ ...params, articleName: value }));
  }

  updateSearchArticleNumber(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchParams.update(params => ({ ...params, articleNumber: value }));
  }

  // Direct setter used by Exceptions modal search field (avoids Event typing)
  setSearchArticleNumberDirect = (value: string) => {
    this.searchParams.update(params => ({ ...params, articleNumber: value }));
  }

  // Form updates - General Article Fields
  updateNewArticleField(field: keyof LabelerArticle, event: Event) {
    const target = event.target as HTMLInputElement;
    let value: any = target.value;
    
    // Convert values based on field type
    if (field === 'isEnabledForLabelers' || field === 'active' || field === 'approved' || field === 'isEnabledForGxCheckWeighers') {
      value = target.checked;
    } else if (field === 'weightDecimalPlaces' || field === 'commonNumber1' || field === 'commonNumber2' || field === 'gxPriceDecimalPlaces') {
      value = parseInt(value) || 0;
    }
    
    this.newArticle.update(article => ({ ...article, [field]: value }));
  }

  // Form updates - ArticlePLU Fields
  updateNewArticlePLUField(field: keyof ArticlePLU, event: Event) {
    const target = event.target as HTMLInputElement;
    let raw = target.value;
    let value: any = raw;

    // Enforce max length for simpleText fields (30 chars)
    if(/^simpleText\d+$/.test(field as string) && typeof value === 'string'){
      if(value.length>30){
        value = value.slice(0,30);
        target.value = value;
      }
      // Do NOT apply any numeric coercion to simpleText fields
      this.newArticle.update(article => ({
        ...article,
        articlePLU: article.articlePLU ? { ...article.articlePLU, [field]: value } : this.createEmptyArticlePLU()
      }));
      return;
    }

    const numericExact = [
      'unitPriceValue','specialUnitPriceValue','fixedWeightValue','minWeightValue','maxWeightValue','tareWeightValue',
      'shelfLifeDays1','shelfLifeDays2','labelParameter','automaticLabelParameter','weightClass','staticText',
      'generalNumber1','generalNumber2','generalNumber3','generalNumber4','generalNumber5','generalNumber6','generalNumber7','generalNumber8','generalNumber9','generalNumber10',
      'generalNumber11','generalNumber12','generalNumber13','generalNumber14','generalNumber15','generalNumber16','generalNumber17','generalNumber18','generalNumber19','generalNumber20',
      'logoField1','logoField2','logoField3','logoField4','logoField5','logoField6','logoField7','logoField8','logoField9','logoField10',
      'codeField1','codeField2','codeField3','codeField4','codeField5','codeField6','codeField7'
    ];
    if (numericExact.includes(field as string)) {
      const parsed = parseFloat(raw);
      value = isNaN(parsed) ? 0 : parsed;
    }
    
    this.newArticle.update(article => ({
      ...article,
      articlePLU: article.articlePLU ? { ...article.articlePLU, [field]: value } : this.createEmptyArticlePLU()
    }));
  }

  // Specialized handlers for Unit Price to mirror stable behavior of fixed weight
  onUnitPriceInput(event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    // Allow only digits and one decimal point, up to 4 decimals while typing
    if (/^\d*(\.?\d{0,4})?$/.test(raw)) {
      this.unitPriceInput.set(raw);
    }
  }

  commitUnitPrice() {
    const raw = this.unitPriceInput();
    const parsed = raw === '' || raw === '.' ? 0 : parseFloat(raw);
    this.updateNewArticlePLUField('unitPriceValue', { target: { value: isNaN(parsed) ? '0' : parsed.toString() } } as any as Event);
    // Normalize displayed format (preserve user precision)
    this.unitPriceInput.set(isNaN(parsed) ? '0' : parsed.toString());
  }

  onSelectedUnitPriceInput(event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    if (/^\d*(\.?\d{0,4})?$/.test(raw)) {
      this.selectedUnitPriceInput.set(raw);
    }
  }

  commitSelectedUnitPrice() {
    const raw = this.selectedUnitPriceInput();
    const parsed = raw === '' || raw === '.' ? 0 : parseFloat(raw);
    this.updateSelectedArticlePLUField('unitPriceValue', { target: { value: isNaN(parsed) ? '0' : parsed.toString() } } as any as Event);
    this.selectedUnitPriceInput.set(isNaN(parsed) ? '0' : parsed.toString());
  }

  // Form updates - TextField (with number and text properties)
  updateNewArticleTextField(field: keyof ArticlePLU, property: 'number' | 'text', event: Event) {
    const target = event.target as HTMLInputElement;
    let value: any = target.value;
    
    if (property === 'number') {
      value = parseInt(value) || -1;
    }
    
    this.newArticle.update(article => ({
      ...article,
      articlePLU: article.articlePLU ? {
        ...article.articlePLU,
        [field]: {
          ...(article.articlePLU[field] as TextField),
          [property]: value
        }
      } : this.createEmptyArticlePLU()
    }));
  }

  // Form updates - IngredientsProportion
  updateNewArticleIngredientsField(property: keyof IngredientsProportion, event: Event) {
    const target = event.target as HTMLInputElement;
    let value: any = target.value;
    
    if (property === 'value' || property === 'decimalPlaces') {
      value = parseFloat(value) || 0;
    }
    
    this.newArticle.update(article => ({
      ...article,
      articlePLU: article.articlePLU ? {
        ...article.articlePLU,
        ingredientsProportion: {
          ...article.articlePLU.ingredientsProportion,
          [property]: value
        }
      } : this.createEmptyArticlePLU()
    }));
  }

  updateSelectedArticleField(field: keyof LabelerArticle, event: Event) {
    const target = event.target as HTMLInputElement;
    let value: any = target.value;
    
    // Convert values based on field type
    if (field === 'isEnabledForLabelers' || field === 'active' || field === 'approved' || field === 'isEnabledForGxCheckWeighers') {
      value = target.checked;
    } else if (field === 'weightDecimalPlaces' || field === 'commonNumber1' || field === 'commonNumber2' || field === 'gxPriceDecimalPlaces') {
      value = parseInt(value) || 0;
    }
    
    this.selectedArticle.update(article => article ? { ...article, [field]: value } : null);
  }

  // Selected Article PLU Updates
  updateSelectedArticlePLUField(field: keyof ArticlePLU, event: Event) {
    const target = event.target as HTMLInputElement;
    let value: any = target.value;
    
    // Convert values based on field type
    if (field.includes('Number') || field.includes('Field') || field.includes('Value') || field.includes('Days') || 
        field.includes('Rule') || field.includes('Control') || field.includes('Parameter') || field.includes('Language') ||
        field.includes('Template') || field.includes('Class') || field.includes('Height') || field.includes('Length') ||
        field.includes('LDI') || field.includes('LCE') || field.includes('Copies') || field.includes('Package')) {
      value = parseFloat(value) || 0;
    } else if (field.includes('Enabled') || field.includes('Label')) {
      value = target.checked;
    }
    
    this.selectedArticle.update(article => article ? {
      ...article,
  articlePLU: article.articlePLU ? { ...article.articlePLU, [field]: field === 'labelingMode' ? this.normalizeLabelingMode(value) : value } : this.createEmptyArticlePLU()
    } : null);
  }

  updateSelectedArticleTextField(field: keyof ArticlePLU, property: 'number' | 'text', event: Event) {
    const target = event.target as HTMLInputElement;
    let value: any = target.value;
    
    if (property === 'number') {
      value = parseInt(value) || -1;
    }
    
    this.selectedArticle.update(article => article ? {
      ...article,
      articlePLU: article.articlePLU ? {
        ...article.articlePLU,
        [field]: {
          ...(article.articlePLU[field] as TextField),
          [property]: value
        }
      } : this.createEmptyArticlePLU()
    } : null);
  }

  updateSelectedArticleIngredientsField(property: keyof IngredientsProportion, event: Event) {
    const target = event.target as HTMLInputElement;
    let value: any = target.value;
    
    if (property === 'value' || property === 'decimalPlaces') {
      value = parseFloat(value) || 0;
    }
    
    this.selectedArticle.update(article => article ? {
      ...article,
      articlePLU: article.articlePLU ? {
        ...article.articlePLU,
        ingredientsProportion: {
          ...article.articlePLU.ingredientsProportion,
          [property]: value
        }
      } : this.createEmptyArticlePLU()
    } : null);
  }

  // Helper functions for displaying dynamic fields
  getTextFieldsWithValues(article: LabelerArticle | null): Array<{key: string, field: TextField, index: number}> {
    if (!article?.articlePLU) return [];
    
    const textFields = [];
    for (let i = 1; i <= 20; i++) {
      const fieldKey = `textField${i}` as keyof ArticlePLU;
      const field = article.articlePLU[fieldKey] as TextField;
      // Show field if it has an assigned number OR non-empty text value
      if (field && (field.number !== -1 || (field.text && field.text.trim() !== ''))) {
        textFields.push({
          key: fieldKey,
          field: field,
          index: i
        });
      }
    }
    return textFields;
  }

  getSimpleTextsWithValues(article: LabelerArticle | null): Array<{key: string, value: string, index: number}> {
    if (!article?.articlePLU) return [];
    
    const simpleTexts = [];
    for (let i = 1; i <= 30; i++) {
      const fieldKey = `simpleText${i}` as keyof ArticlePLU;
      const value = article.articlePLU[fieldKey] as string;
      if (value && value !== '') {
        simpleTexts.push({
          key: fieldKey,
          value: value,
          index: i
        });
      }
    }
    return simpleTexts;
  }

  getCodeFieldsWithValues(article: LabelerArticle | null): Array<{fieldKey: string, stringKey: string, fieldValue: number, stringValue: string, index: number}> {
    if (!article?.articlePLU) return [];
    
    const codeFields = [];
    for (let i = 1; i <= 7; i++) {
      const fieldKey = `codeField${i}` as keyof ArticlePLU;
      const stringKey = `codeString${i}` as keyof ArticlePLU;
      const fieldValue = article.articlePLU[fieldKey] as number;
      const stringValue = article.articlePLU[stringKey] as string;
      
      if (fieldValue !== 0 || (stringValue && stringValue !== '')) {
        codeFields.push({
          fieldKey: fieldKey,
          stringKey: stringKey,
          fieldValue: fieldValue,
          stringValue: stringValue,
          index: i
        });
      }
    }
    return codeFields;
  }

  getGeneralNumbersWithValues(article: LabelerArticle | null): Array<{key: string, value: number, index: number}> {
    if (!article?.articlePLU) return [];
    
    const generalNumbers = [];
    for (let i = 1; i <= 20; i++) {
      const fieldKey = `generalNumber${i}` as keyof ArticlePLU;
      const value = article.articlePLU[fieldKey] as number;
      if (value !== 0) {
        generalNumbers.push({
          key: fieldKey,
          value: value,
          index: i
        });
      }
    }
    return generalNumbers;
  }

  getLogosWithValues(article: LabelerArticle | null): Array<{key: string, value: number, index: number}> {
    if (!article?.articlePLU) return [];
    
    const logos = [];
    for (let i = 1; i <= 10; i++) {
      const fieldKey = `logoField${i}` as keyof ArticlePLU;
      const value = article.articlePLU[fieldKey] as number;
      if (value !== 0) {
        logos.push({
          key: fieldKey,
          value: value,
          index: i
        });
      }
    }
    return logos;
  }

  // Dynamic field update methods
  updateSelectedArticleTextFieldDynamic(fieldKey: string, property: 'number' | 'text', event: Event) {
    const target = event.target as HTMLInputElement;
    let value: any = target.value;
    
    if (property === 'number') {
      value = parseInt(value) || -1;
    }
    
    this.selectedArticle.update(article => article ? {
      ...article,
      articlePLU: article.articlePLU ? {
        ...article.articlePLU,
        [fieldKey]: {
          ...(article.articlePLU[fieldKey as keyof ArticlePLU] as TextField),
          [property]: value
        }
      } : this.createEmptyArticlePLU()
    } : null);
  }

  // Raw numeric validation for dynamic text field number inputs (edit mode)
  onEditTextFieldNumberInput(fieldKey: string, event: Event) {
    const raw = (event.target as HTMLInputElement).value.trim();
    if (/^\d{0,10}$/.test(raw)) {
      this.rawTextFieldNumbersEdit[fieldKey] = raw; // buffer only
    }
  }

  commitEditTextFieldNumber(fieldKey: string) {
    const raw = this.rawTextFieldNumbersEdit[fieldKey];
    const value = raw === undefined || raw === '' ? '-1' : raw;
    this.updateSelectedArticleTextFieldDynamic(fieldKey, 'number', { target: { value } } as any as Event);
    // normalize buffer after commit
    if (value === '-1') delete this.rawTextFieldNumbersEdit[fieldKey];
    else this.rawTextFieldNumbersEdit[fieldKey] = value;
  }

  onCreateTextFieldNumberInput(fieldKey: string, event: Event) {
    const raw = (event.target as HTMLInputElement).value.trim();
    if (/^\d{0,10}$/.test(raw)) {
      this.rawTextFieldNumbersCreate[fieldKey] = raw;
    }
  }

  commitCreateTextFieldNumber(fieldKey: string) {
    const raw = this.rawTextFieldNumbersCreate[fieldKey];
    const value = raw === undefined || raw === '' ? '-1' : raw;
    this.updateNewArticleTextField(fieldKey as keyof ArticlePLU, 'number', { target: { value } } as any as Event);
    if (value === '-1') delete this.rawTextFieldNumbersCreate[fieldKey];
    else this.rawTextFieldNumbersCreate[fieldKey] = value;
  }

  updateSelectedArticlePLUFieldDynamic(fieldKey: string, event: Event) {
    const target = event.target as HTMLInputElement;
    let value: any = target.value;

    // Enforce max length for simpleText fields when editing
    if(/^simpleText\d+$/.test(fieldKey) && typeof value === 'string'){
      if(value.length>30){
        value = value.slice(0,30);
        target.value = value;
      }
      // Direct string update without numeric coercion
      this.selectedArticle.update(article => article ? {
        ...article,
        articlePLU: article.articlePLU ? { ...article.articlePLU, [fieldKey]: value } : this.createEmptyArticlePLU()
      } : null);
      return;
    }
    
    // Convert values based on field type
    if (fieldKey.includes('Number') || fieldKey.includes('Field') || fieldKey.includes('Value') || fieldKey.includes('Days') || 
        fieldKey.includes('Rule') || fieldKey.includes('Control') || fieldKey.includes('Parameter') || fieldKey.includes('Language') ||
        fieldKey.includes('Template') || fieldKey.includes('Class') || fieldKey.includes('Height') || fieldKey.includes('Length') ||
        fieldKey.includes('LDI') || fieldKey.includes('LCE') || fieldKey.includes('Copies') || fieldKey.includes('Package')) {
      value = parseFloat(value) || 0;
    } else if (fieldKey.includes('Enabled') || fieldKey.includes('Label')) {
      value = target.checked;
    }
    
    this.selectedArticle.update(article => article ? {
      ...article,
      articlePLU: article.articlePLU ? { ...article.articlePLU, [fieldKey]: fieldKey === 'labelingMode' ? this.normalizeLabelingMode(value) : value } : this.createEmptyArticlePLU()
    } : null);
  }

  private normalizeLabelingMode(mode: string | undefined): string {
    if (!mode) return 'fixedWeight';
    if (this.allowedLabelingModes.includes(mode)) return mode;
    if (mode === 'variableWeight') return 'weight';
    if (mode === 'piece') return 'fixedValue';
    return 'fixedWeight';
  }
}
