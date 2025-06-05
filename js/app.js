// ASPEN Digital Alarms - JavaScript Principal
'use strict';

class AspenAlarmsApp {
  constructor() {
    // Configurações
    this.alarmTimes = [
      '08:30', '09:50', '10:10', '10:30', '10:50',
      '12:10', '12:30', '12:50', '13:10',
      '14:30', '14:50', '15:10', '15:30',
      '16:50', '17:10', '17:30', '17:50',
      '19:10', '19:30', '19:50'
    ];

    // Estado da aplicação
    this.isActive = false;
    this.timeInterval = null;
    this.audioContext = null;
    this.currentVolume = 0.7;
    this.notificationsEnabled = false;
    this.deferredPrompt = null;
    this.wakeLock = null;

    // Elementos DOM
    this.elements = {
      currentTime: document.getElementById('currentTime'),
      nextAlarm: document.getElementById('nextAlarm'),
      systemStatus: document.getElementById('systemStatus'),
      startBtn: document.getElementById('startBtn'),
      stopBtn: document.getElementById('stopBtn'),
      volumeSlider: document.getElementById('volumeSlider'),
      volumeValue: document.getElementById('volumeValue'),
      popupOverlay: document.getElementById('popupOverlay'),
      alarmMessage: document.getElementById('alarmMessage'),
      installPrompt: document.getElementById('installPrompt'),
      connectionStatus: document.getElementById('connectionStatus')
    };

    this.init();
  }

  // Inicialização da aplicação
  init() {
    console.log('🚀 Iniciando ASPEN Digital Alarms...');
    
    this.registerServiceWorker();
    this.setupEventListeners();
    this.updateClock();
    this.updateConnectionStatus();
    this.checkNotificationPermission();
    this.restoreState();
    this.handleURLParams();
    
    console.log('✅ ASPEN Digital Alarms carregado!');
    console.log('📋 Horários configurados:', this.alarmTimes);
  }

  // Registrar Service Worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registrado:', registration.scope);
        
        // Escutar atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });
      } catch (error) {
        console.error('❌ Falha no Service Worker:', error);
      }
    }
  }

  // Configurar event listeners
  setupEventListeners() {
    // PWA Installation
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.elements.installPrompt.style.display = 'block';
    });

    // Volume control
    this.elements.volumeSlider.addEventListener('input', (e) => {
      this.currentVolume = e.target.value / 100;
      this.elements.volumeValue.textContent = e.target.value + '%';
      this.saveSettings();
    });

    // Conectividade
    window.addEventListener('online', () => this.updateConnectionStatus());
    window.addEventListener('offline', () => this.updateConnectionStatus());

    // Visibilidade da página
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isActive) {
        console.log('⚠️ Página em segundo plano - alarmes continuam ativos');
      } else if (!document.hidden && this.isActive) {
        console.log('✅ Página em primeiro plano');
        this.updateClock();
      }
    });

    // Prevenção de sleep
    document.addEventListener('click', () => this.requestWakeLock());

    // PWA installed
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA instalado com sucesso!');
      this.elements.installPrompt.style.display = 'none';
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ') { // Spacebar
        e.preventDefault();
        this.isActive ? this.stopAlarms() : this.startAlarms();
      } else if (e.key === 't' || e.key === 'T') {
        this.testAlarm();
      }
    });
  }

  // Manipular parâmetros da URL
  handleURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action === 'start') {
      setTimeout(() => this.startAlarms(), 1000);
    } else if (action === 'test') {
      setTimeout(() => this.testAlarm(), 1000);
    }
  }

  // Inicializar Audio Context
  initAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Reativar se suspenso
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Criar som de alarme melhorado
  createAlarmSound() {
    this.initAudio();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();
    
    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Sequência harmoniosa C-E-G
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    const duration = 0.8;
    
    frequencies.forEach((freq, index) => {
      const startTime = this.audioContext.currentTime + (index * 0.15);
      oscillator.frequency.setValueAtTime(freq, startTime);
    });
    
    // Filtro passa-baixa para som mais suave
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(2000, this.audioContext.currentTime);
    
    // Envelope de volume
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.currentVolume * 0.3, this.audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Tocar sequência de alarme
  playAlarmSound() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.createAlarmSound(), i * 900);
    }
  }

  // Solicitar permissão para notificações
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      this.showAlert('❌ Seu navegador não suporta notificações.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        this.notificationsEnabled = true;
        
        // Teste de notificação
        new Notification('🔔 ASPEN Digital Alarms', {
          body: 'Notificações ativadas! Sistema pronto para usar.',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: 'test-notification'
        });
        
        this.updateButtonState(event.target, '✅ Ativadas', 'success');
        this.saveSettings();
      } else {
        this.showAlert('❌ Permissão negada. Ative nas configurações do navegador.');
      }
    } catch (error) {
      console.error('Erro ao solicitar notificações:', error);
    }
  }

  // Enviar notificação push
  sendPushNotification(time) {
    if (!this.notificationsEnabled || Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification('⏰ ALARME ASPEN Digital', {
      body: `🔔 Alarme disparado às ${time}!\n📋 Verifique suas tarefas pendentes.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      requireInteraction: true,
      tag: `aspen-alarm-${time}`,
      timestamp: Date.now(),
      actions: [
        {
          action: 'snooze',
          title: '⏰ Soneca 5min',
          icon: '/icons/action-snooze.png'
        },
        {
          action: 'dismiss',
          title: '✅ Dispensar',
          icon: '/icons/action-dismiss.png'
        }
      ]
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto fechar após 15 segundos
    setTimeout(() => notification.close(), 15000);
  }

  // Mostrar popup de alerta
  showPopup(time) {
    this.elements.alarmMessage.innerHTML = 
      `🔔 <strong>Alarme às ${time}</strong><br>
      📋 Hora do seu compromisso ASPEN Digital!<br>
      <small>⏰ ${new Date().toLocaleString('pt-BR')}</small>`;
    
    this.elements.popupOverlay.style.display = 'flex';
    
    // Animação de piscada
    document.body.style.animation = 'pulse 0.5s infinite';
    
    // Vibração no mobile
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Auto fechar após 30 segundos
    setTimeout(() => this.closePopup(), 30000);
  }

  // Fechar popup
  closePopup() {
    this.elements.popupOverlay.style.display = 'none';
    document.body.style.animation = '';
  }

  // Disparar alarme completo
  triggerAlarm(time) {
    console.log(`🔔 ALARME DISPARADO: ${time} - ${new Date().toLocaleString('pt-BR')}`);
    
    // Som
    this.playAlarmSound();
    
    // Popup visual
    this.showPopup(time);
    
    // Notificação push
    this.sendPushNotification(time);
    
    // Destacar horário na lista
    this.highlightAlarmTime(time);
    
    // Salvar log
    this.saveAlarmLog(time);
  }

  // Destacar horário ativo na lista
  highlightAlarmTime(time) {
    // Remover destaques anteriores
    document.querySelectorAll('.alarm-time.active').forEach(el => {
      el.classList.remove('active');
    });
    
    // Adicionar destaque ao horário atual
    document.querySelectorAll('.alarm-time').forEach(el => {
      if (el.getAttribute('data-time') === time) {
        el.classList.add('active');
        setTimeout(() => el.classList.remove('active'), 5000);
      }
    });
  }

  // Destacar próximo alarme
  highlightNextAlarm(nextTime) {
    document.querySelectorAll('.alarm-time.next').forEach(el => {
      el.classList.remove('next');
    });
    
    if (nextTime) {
      document.querySelectorAll('.alarm-time').forEach(el => {
        if (el.getAttribute('data-time') === nextTime) {
          el.classList.add('next');
        }
      });
    }
  }

  // Atualizar relógio e verificar alarmes
  updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR');
    const currentTimeFormatted = timeString.substring(0, 5); // HH:MM
    
    this.elements.currentTime.textContent = timeString;
    
    // Verificar alarmes se sistema ativo
    if (this.isActive) {
      this.checkAlarms(currentTimeFormatted, now);
    }
    
    // Atualizar próximo alarme
    this.updateNextAlarm();
  }

  // Verificar se é hora de disparar alarmes
  checkAlarms(currentTimeFormatted, now) {
    this.alarmTimes.forEach(alarmTime => {
      if (currentTimeFormatted === alarmTime) {
        // Verificar se já não disparou neste minuto
        const lastTrigger = localStorage.getItem('lastAlarmTrigger');
        const currentMinute = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}-${currentTimeFormatted}`;
        
        if (lastTrigger !== currentMinute) {
          this.triggerAlarm(alarmTime);
          localStorage.setItem('lastAlarmTrigger', currentMinute);
        }
      }
    });
  }

  // Calcular e mostrar próximo alarme
  updateNextAlarm() {
    const statusEl = this.elements.systemStatus;
    
    if (!this.isActive) {
      this.elements.nextAlarm.textContent = 'Sistema parado - Clique em "Iniciar"';
      statusEl.textContent = '⏹️ Sistema Parado';
      statusEl.className = 'system-status status-inactive';
      this.highlightNextAlarm(null);
      return;
    }

    statusEl.textContent = '▶️ Sistema Ativo';
    statusEl.className = 'system-status status-active';

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    let nextAlarm = null;
    let minDiff = Infinity;
    
    this.alarmTimes.forEach(alarmTime => {
      const [hours, minutes] = alarmTime.split(':').map(Number);
      const alarmMinutes = hours * 60 + minutes;
      
      let diff = alarmMinutes - currentTime;
      if (diff < 0) diff += 24 * 60; // Próximo dia
      
      if (diff < minDiff) {
        minDiff = diff;
        nextAlarm = alarmTime;
      }
    });
    
    if (nextAlarm) {
      const hoursLeft = Math.floor(minDiff / 60);
      const minutesLeft = minDiff % 60;
      
      let timeLeftText = '';
      if (hoursLeft > 0) {
        timeLeftText = `em ${hoursLeft}h ${minutesLeft}min`;
      } else if (minutesLeft > 0) {
        timeLeftText = `em ${minutesLeft}min`;
      } else {
        timeLeftText = 'AGORA!';
      }
      
      this.elements.nextAlarm.innerHTML = 
        `🎯 Próximo: <strong>${nextAlarm}</strong> (${timeLeftText})`;
        
      this.highlightNextAlarm(nextAlarm);
    }
  }

  // Iniciar sistema de alarmes
  async startAlarms() {
    this.initAudio();
    this.isActive = true;
    this.timeInterval = setInterval(() => this.updateClock(), 1000);
    
    this.updateButtonState(this.elements.startBtn, '<div class="loading"></div> Ativo', 'disabled');
    this.elements.stopBtn.classList.remove('disabled');
    
    // Solicitar wake lock
    await this.requestWakeLock();
    
    console.log('✅ Sistema de alarmes iniciado!');
    this.updateClock();
    this.saveSettings();
  }

  // Parar sistema de alarmes
  stopAlarms() {
    this.isActive = false;
    
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
      this.timeInterval = null;
    }
    
    this.updateButtonState(this.elements.startBtn, '▶️ Iniciar', 'normal');
    this.elements.stopBtn.classList.add('disabled');
    
    // Remover destaques
    document.querySelectorAll('.alarm-time.active, .alarm-time.next').forEach(el => {
      el.classList.remove('active', 'next');
    });
    
    // Liberar wake lock
    this.releaseWakeLock();
    
    console.log('⏹️ Sistema de alarmes parado!');
    this.updateNextAlarm();
    this.saveSettings();
  }

  // Testar som
  testAlarm() {
    this.initAudio();
    this.playAlarmSound();
    
    const btn = event.target;
    this.updateButtonState(btn, '🔊 Testando...', 'loading');
    
    setTimeout(() => {
      this.updateButtonState(btn, '🔊 Testar', 'normal');
    }, 3000);
  }

  // Instalar PWA
  async installPWA() {
    if (!this.deferredPrompt) return;
    
    try {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ PWA instalado');
      }
      
      this.deferredPrompt = null;
      this.elements.installPrompt.style.display = 'none';
    } catch (error) {
      console.error('Erro na instalação PWA:', error);
    }
  }

  // Dispensar instalação
  dismissInstall() {
    this.elements.installPrompt.style.display = 'none';
  }

  // Atualizar status de conectividade
  updateConnectionStatus() {
    const indicator = this.elements.connectionStatus;
    
    if (navigator.onLine) {
      indicator.textContent = '📶 Online';
      indicator.className = 'offline-indicator online-indicator';
      indicator.style.display = 'none';
    } else {
      indicator.textContent = '📵 Offline';
      indicator.className = 'offline-indicator';
      indicator.style.display = 'block';
    }
  }

  // Solicitar Wake Lock
  async requestWakeLock() {
    try {
      if ('wakeLock' in navigator && !this.wakeLock) {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('🔆 Tela mantida ativa');
      }
    } catch (err) {
      console.log('⚠️ Wake Lock não suportado');
    }
  }

  // Liberar Wake Lock
  releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
      console.log('🔅 Wake Lock liberado');
    }
  }

  // Verificar permissão de notificações
  checkNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'granted') {
      this.notificationsEnabled = true;
    }
  }

  // Salvar configurações
  saveSettings() {
    const settings = {
      isActive: this.isActive,
      volume: this.currentVolume,
      notificationsEnabled: this.notificationsEnabled,
      timestamp: Date.now()
    };
    
    localStorage.setItem('aspenAlarmsSettings', JSON.stringify(settings));
  }

  // Restaurar estado anterior
  restoreState() {
    try {
      const settings = JSON.parse(localStorage.getItem('aspenAlarmsSettings') || '{}');
      
      if (settings.volume !== undefined) {
        this.currentVolume = settings.volume;
        this.elements.volumeSlider.value = Math.round(settings.volume * 100);
        this.elements.volumeValue.textContent = Math.round(settings.volume * 100) + '%';
      }
      
      if (settings.notificationsEnabled) {
        this.notificationsEnabled = settings.notificationsEnabled;
      }
      
      // Restaurar sistema ativo se foi fechado há menos de 1 hora
      if (settings.isActive && settings.timestamp && 
          (Date.now() - settings.timestamp) < 3600000) {
        setTimeout(() => this.startAlarms(), 1000);
      }
    } catch (error) {
      console.log('⚠️ Erro ao restaurar configurações:', error);
    }
  }

  // Salvar log de alarmes
  saveAlarmLog(time) {
    try {
      const logs = JSON.parse(localStorage.getItem('aspenAlarmLogs') || '[]');
      logs.push({
        time: time,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('pt-BR')
      });
      
      // Manter apenas os últimos 50 logs
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      localStorage.setItem('aspenAlarmLogs', JSON.stringify(logs));
    } catch (error) {
      console.error('Erro ao salvar log:', error);
    }
  }

  // Utilidades
  updateButtonState(button, text, state) {
    button.innerHTML = text;
    button.classList.remove('disabled', 'active', 'loading');
    
    if (state === 'disabled') {
      button.classList.add('disabled');
    } else if (state === 'active') {
      button.classList.add('active');
    } else if (state === 'success') {
      button.style.background = 'linear-gradient(45deg, #4ECDC4, #44A08D)';
      setTimeout(() => {
        button.style.background = '';
      }, 2000);
    }
  }

  showAlert(message) {
    alert(message);
  }

  showUpdateNotification() {
    if (confirm('📥 Nova versão disponível! Deseja atualizar?')) {
      window.location.reload();
    }
  }
}

// Expor funções globais para compatibilidade com HTML inline
window.aspenApp = null;

window.startAlarms = () => window.aspenApp?.startAlarms();
window.stopAlarms = () => window.aspenApp?.stopAlarms();
window.testAlarm = () => window.aspenApp?.testAlarm();
window.requestNotificationPermission = () => window.aspenApp?.requestNotificationPermission();
window.installPWA = () => window.aspenApp?.installPWA();
window.dismissInstall = () => window.aspenApp?.dismissInstall();
window.closePopup = () => window.aspenApp?.closePopup();

// Inicialização quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.aspenApp = new AspenAlarmsApp();
});

// Relógio global (funciona mesmo quando sistema parado)
setInterval(() => {
  const currentTimeEl = document.getElementById('currentTime');
  if (currentTimeEl) {
    const now = new Date();
    currentTimeEl.textContent = now.toLocaleTimeString('pt-BR');
  }
}, 1000);
