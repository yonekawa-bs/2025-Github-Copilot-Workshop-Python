class KitchenGameUI {
    constructor() {
        this.gameStatus = false;
        this.updateInterval = null;
        this.maxRecipes = 10;
        
        this.initializeElements();
        this.bindEvents();
        this.updateUI();
    }

    initializeElements() {
        // ボタン要素
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.deliverBtn = document.getElementById('deliverBtn');
        
        // ステータス要素
        this.successCount = document.getElementById('successCount');
        this.waitingCount = document.getElementById('waitingCount');
        this.gameStatusElement = document.getElementById('gameStatus');
        
        // プログレスバー要素
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.progressPercentage = document.getElementById('progressPercentage');
        
        // コンテナ要素
        this.waitingRecipes = document.getElementById('waitingRecipes');
        this.gameHistory = document.getElementById('gameHistory');
        
        // 材料チェックボックス
        this.ingredientCheckboxes = document.querySelectorAll('.ingredient-item input');
    }

    bindEvents() {
        // ゲーム制御ボタン
        this.startBtn.addEventListener('click', () => this.startGame());
        this.stopBtn.addEventListener('click', () => this.stopGame());
        
        // 配達ボタン
        this.deliverBtn.addEventListener('click', () => this.deliverRecipe());
        
        // 材料選択の視覚的フィードバック
        this.ingredientCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateDeliveryButton());
        });
    }

    async startGame() {
        try {
            const response = await fetch('/api/start_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                this.gameStatus = true;
                this.startBtn.disabled = true;
                this.stopBtn.disabled = false;
                this.gameStatusElement.textContent = '進行中';
                this.gameStatusElement.parentElement.parentElement.querySelector('.status-icon').style.backgroundColor = 'var(--success-color)';
                
                // 定期更新開始
                this.startPeriodicUpdate();
                
                this.showNotification('ゲームが開始されました！', 'success');
            }
        } catch (error) {
            console.error('ゲーム開始エラー:', error);
            this.showNotification('ゲーム開始に失敗しました', 'error');
        }
    }

    async stopGame() {
        try {
            const response = await fetch('/api/stop_game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                this.gameStatus = false;
                this.startBtn.disabled = false;
                this.stopBtn.disabled = true;
                this.gameStatusElement.textContent = '停止中';
                this.gameStatusElement.parentElement.parentElement.querySelector('.status-icon').style.backgroundColor = 'var(--secondary-color)';
                
                // 定期更新停止
                this.stopPeriodicUpdate();
                
                this.showNotification('ゲームが停止されました', 'info');
            }
        } catch (error) {
            console.error('ゲーム停止エラー:', error);
            this.showNotification('ゲーム停止に失敗しました', 'error');
        }
    }

    async deliverRecipe() {
        const selectedIngredients = Array.from(this.ingredientCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
        
        if (selectedIngredients.length === 0) {
            this.showNotification('材料を選択してください', 'warning');
            return;
        }
        
        try {
            const response = await fetch('/api/deliver_recipe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ingredients: selectedIngredients
                })
            });
            
            if (response.ok) {
                // チェックボックスをリセット
                this.ingredientCheckboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
                this.updateDeliveryButton();
                
                // UI更新
                setTimeout(() => this.updateUI(), 500);
                
                this.showNotification(`レシピを配達しました: ${selectedIngredients.join(', ')}`, 'info');
            }
        } catch (error) {
            console.error('配達エラー:', error);
            this.showNotification('配達に失敗しました', 'error');
        }
    }

    async updateUI() {
        try {
            const response = await fetch('/api/game_status');
            const data = await response.json();
            
            if (response.ok) {
                // ステータス更新
                this.successCount.textContent = data.successful_recipes;
                this.waitingCount.textContent = data.waiting_recipes.length;
                
                // プログレスバー更新
                this.updateProgressBar(data.successful_recipes);
                
                // 待機中レシピ更新
                this.updateWaitingRecipes(data.waiting_recipes);
                
                // 履歴更新
                this.updateHistory(data.history);
                
                // ゲーム更新API呼び出し（新しいレシピ生成のため）
                if (this.gameStatus) {
                    fetch('/api/update');
                }
            }
        } catch (error) {
            console.error('UI更新エラー:', error);
        }
    }

    updateProgressBar(successCount) {
        const percentage = Math.min((successCount / this.maxRecipes) * 100, 100);
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `${successCount} / ${this.maxRecipes} レシピ完了`;
        this.progressPercentage.textContent = `${Math.round(percentage)}%`;
        
        // 完了時の特別効果
        if (successCount >= this.maxRecipes) {
            this.progressFill.style.background = 'linear-gradient(90deg, #fbbf24, #f59e0b)';
            this.showNotification('目標達成！おめでとうございます！', 'success');
        }
    }

    updateWaitingRecipes(recipes) {
        if (recipes.length === 0) {
            this.waitingRecipes.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-coffee"></i>
                    <p>待機中のレシピはありません</p>
                </div>
            `;
        } else {
            this.waitingRecipes.innerHTML = recipes.map(recipe => `
                <div class="recipe-item">
                    <i class="fas fa-utensils"></i>
                    <span class="recipe-name">${recipe}</span>
                </div>
            `).join('');
        }
    }

    updateHistory(history) {
        if (history.length === 0) {
            this.gameHistory.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <p>履歴がありません</p>
                </div>
            `;
        } else {
            this.gameHistory.innerHTML = history
                .sort((a, b) => b.timestamp - a.timestamp)
                .map(event => {
                    const date = new Date(event.timestamp * 1000);
                    const timeStr = date.toLocaleTimeString('ja-JP');
                    const icon = this.getHistoryIcon(event.type);
                    const className = event.type.includes('success') ? 'success' : 
                                    event.type.includes('failed') ? 'failed' : 'spawned';
                    
                    return `
                        <div class="history-item ${className}">
                            <div class="history-icon">
                                <i class="${icon}"></i>
                            </div>
                            <div class="history-content">
                                <div class="history-message">${event.message}</div>
                                <div class="history-time">${timeStr}</div>
                            </div>
                        </div>
                    `;
                }).join('');
        }
    }

    getHistoryIcon(eventType) {
        switch (eventType) {
            case 'recipe_success':
                return 'fas fa-check';
            case 'recipe_failed':
                return 'fas fa-times';
            case 'recipe_spawned':
                return 'fas fa-plus';
            default:
                return 'fas fa-circle';
        }
    }

    updateDeliveryButton() {
        const hasSelected = Array.from(this.ingredientCheckboxes).some(cb => cb.checked);
        this.deliverBtn.disabled = !hasSelected;
    }

    startPeriodicUpdate() {
        this.updateInterval = setInterval(() => {
            this.updateUI();
        }, 2000); // 2秒ごとに更新
    }

    stopPeriodicUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    showNotification(message, type = 'info') {
        // 簡単な通知システム
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // タイプによる色分け
        const colors = {
            success: '#059669',
            error: '#dc2626',
            warning: '#d97706',
            info: '#2563eb'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // 3秒後に削除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// CSS アニメーション追加
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    const app = new KitchenGameUI();
    
    // 初期状態での配達ボタン無効化
    app.updateDeliveryButton();
    
    console.log('キッチンゲーム管理システムが初期化されました');
});