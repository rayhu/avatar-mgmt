export interface Language {
  selectLanguage: string;
  switchToChinese: string;
  switchToEnglish: string;
  'zh-CN': string;
  'en': string;
}

export interface Login {
  title: string;
  username: string;
  usernamePlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  submit: string;
  error: string;
  usernameTooShort: string;
  usernameTooLong: string;
  usernameInvalid: string;
}

export interface ModelManagement {
  title: string;
  modelList: string;
  modelGallery: string;
  modelSelection: string;
  galleryTip: string;
  listTip: string;
  uploadModel: string;
  deleteModel: string;
  editModel: string;
  viewModel: string;
  modelStatus: {
    ready: string;
    draft: string;
    offline: string;
  };
  modelInfo: {
    name: string;
    description: string;
    status: string;
    createTime: string;
    updateTime: string;
  };
}

export interface Test {
  title: string;
  viewer: {
    title: string;
    animationControl: string;
    emotionControl: string;
  };
}

export interface Animate {
  title: string;
  text: string;
  textPlaceholder: string;
  textTooLong: string;
  emotion: string;
  emotions: {
    neutral: string;
    angry: string;
    surprised: string;
    sad: string;
  };
  action: string;
  actions: {
    idle: string;
    walking: string;
    running: string;
    jump: string;
    wave: string;
    dance: string;
    death: string;
    no: string;
    punch: string;
    sitting: string;
    standing: string;
    thumbsUp: string;
    walkJump: string;
    yes: string;
  };
  submit: string;
  record: string;
  stopRecording: string;
  download: string;
  recordError: string;
  recordingTip: string;
  processing: string;
  loading: string;
  timeline: {
    title: string;
    time: string;
    action: string;
    emotion: string;
    editKeyframe: string;
    addAction: string;
    addEmotion: string;
    delete: string;
    clear: string;
  };
}

export interface Errors {
  unknown: string;
  network: string;
  auth: string;
  validation: string;
  server: string;
  notFound: string;
  forbidden: string;
  rateLimit: string;
}

export interface Messages {
  language: Language;
  login: Login;
  logout: string;
  admin: string;
  user: string;
  model: string;
  ready: string;
  draft: string;
  offline: string;
  modelManagement: ModelManagement;
  test: Test;
  animate: Animate;
  errors: Errors;
} 