import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../auth';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './data-maintenance.html',
  styleUrls: ['./data-maintenance.scss']
})
export class DataMaintenanceComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  private readonly baseUrl = 'http://localhost:9997';

  // State signals
  articles = signal<LabelerArticle[]>([]);
  selectedArticle = signal<LabelerArticle | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  // Form controls
  searchParams = signal<ArticleSearchParams>({
    skip: 0,
    take: 100,
    sort: 'Number+',
    articleName: '',
    articleNumber: ''
  });

  // Legacy modal states (delete & confirmation retained)
  showDeleteConfirm = signal(false);

  // View states for full page navigation
  currentView = signal<'list' | 'create' | 'edit'>('list');
  
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
  activeDebugTab = 'list';
  jsonCollapsed = signal(true); // collapse debug panels by default
  debugApiResponses = {
    listArticles: null as any,
    getArticle: null as any,
    createArticle: null as any,
    updateArticle: null as any,
    deleteArticle: null as any
  };

  private readonly allowedLabelingModes = ['weight','fixedPrice','fixedWeight','fixedValue'];

  // Raw input buffers to preserve user typing (avoid premature numeric coercion)
  unitPriceInput = signal<string>('0');
  selectedUnitPriceInput = signal<string>('');
  // Buffered numeric inputs for textFieldX.number (create & edit)
  rawTextFieldNumbersCreate: { [key: string]: string } = {};
  rawTextFieldNumbersEdit: { [key: string]: string } = {};

  ngOnInit() {
    // Initialize with proper ArticlePLU structure
    this.newArticle.update(article => ({
      ...article,
      articlePLU: this.createEmptyArticlePLU()
    }));
    
    this.loadArticles();
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
      const requestUrl = `${this.baseUrl}/api/v1/articles/labeler${queryString}`;
      
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
      const requestUrl = `${this.baseUrl}/api/v1/articles/labeler${queryString}`;
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

      const requestUrl = `${this.baseUrl}/api/v1/articles/${encodeURIComponent(articleNumber)}/labeler`;
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
      const requestUrl = `${this.baseUrl}/api/v1/articles/${encodeURIComponent(articleNumber)}/labeler`;
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

      const requestUrl = `${this.baseUrl}/api/v1/articles/labeler`;
      const response = await this.http.post<LabelerArticle>(
        requestUrl,
        article,
        { headers }
      ).toPromise();

      // Store debug information
      this.debugApiResponses.createArticle = {
        timestamp: new Date().toISOString(),
        requestUrl: requestUrl,
        requestHeaders: { ...headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {}) },
        requestBody: article,
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
      const requestUrl = `${this.baseUrl}/api/v1/articles/labeler`;
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
      const requestUrl = `${this.baseUrl}/api/v1/articles/${encodeURIComponent(article.number)}/labeler`;

      await this.http.patch(
        requestUrl,
        patchOperations, // Send the array directly, not wrapped in an object
        { headers }
      ).toPromise();

      // Store debug information
      this.debugApiResponses.updateArticle = {
        timestamp: new Date().toISOString(),
        requestUrl: requestUrl,
        requestHeaders: { ...headers.keys().reduce((acc, key) => ({ ...acc, [key]: headers.get(key) }), {}) },
        requestBody: patchOperations,
        article: article
      };

      await this.loadArticles(); // Refresh the list
      this.closeEditModal();
    } catch (error: any) {
      console.error('Error updating article:', error);
      this.error.set(error?.error?.title || 'Failed to update article');
      
      // Store error debug information
      const patchOperations = this.createPatchOperations(article);
      const requestUrl = `${this.baseUrl}/api/v1/articles/${encodeURIComponent(article.number)}/labeler`;
      this.debugApiResponses.updateArticle = {
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

  async deleteArticle(articleNumber: string) {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.auth.getToken()}`
      });

      const requestUrl = `${this.baseUrl}/api/v1/articles/${encodeURIComponent(articleNumber)}`;
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
      const requestUrl = `${this.baseUrl}/api/v1/articles/${encodeURIComponent(articleNumber)}`;
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
    const newSkip = Math.max(0, (params.skip || 0) - (params.take || 50));
    this.searchParams.update(p => ({ ...p, skip: newSkip }));
    this.loadArticles();
  }

  nextPage() {
    const params = this.searchParams();
    const newSkip = (params.skip || 0) + (params.take || 50);
    this.searchParams.update(p => ({ ...p, skip: newSkip }));
    this.loadArticles();
  }

  // Navigation methods
  goToCreatePage() {
    this.resetNewArticleForm();
    this.apiResponse.set({ type: null, message: '' });
    this.currentView.set('create');
  // Reset raw buffer
  this.unitPriceInput.set('0');
  this.rawTextFieldNumbersCreate = {};
  }

  goToListPage() {
    this.currentView.set('list');
    this.apiResponse.set({ type: null, message: '' });
  }

  goToEditPage(article: LabelerArticle) {
    this.selectedArticle.set({ ...article });
    this.apiResponse.set({ type: null, message: '' });
    this.currentView.set('edit');
  }

  // Backwards compatibility methods (previous modal triggers)
  openCreateModal() { this.goToCreatePage(); }
  closeCreateModal() { this.goToListPage(); }
  openEditModal(article: LabelerArticle) { this.goToEditPage(article); }
  closeEditModal() { this.goToListPage(); }

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
      
      // Text fields
      for (let i = 1; i <= 20; i++) {
        const textFieldKey = `textField${i}` as keyof ArticlePLU;
        const textField = article.articlePLU[textFieldKey] as TextField;
        if (textField) {
          operations.push({ op: 'replace', path: `/articlePLU/${textFieldKey}/number`, value: textField.number });
          operations.push({ op: 'replace', path: `/articlePLU/${textFieldKey}/text`, value: textField.text });
        }
      }

      // Date text fields
      for (let i = 1; i <= 3; i++) {
        const dateFieldKey = `dateTextField${i}` as keyof ArticlePLU;
        const dateField = article.articlePLU[dateFieldKey] as TextField;
        if (dateField) {
          operations.push({ op: 'replace', path: `/articlePLU/${dateFieldKey}/number`, value: dateField.number });
          operations.push({ op: 'replace', path: `/articlePLU/${dateFieldKey}/text`, value: dateField.text });
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
      if (field && field.number !== -1) {
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
