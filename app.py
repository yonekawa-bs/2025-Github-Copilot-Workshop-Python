from flask import Flask, render_template, jsonify, request
import time
import json
from deliverManager import *

app = Flask(__name__)

# Global game state
game_manager = None
delivery_manager = None
game_history = []

def initialize_game():
    """ゲームの初期化"""
    global game_manager, delivery_manager
    
    # サンプルデータ作成
    tomato = KitchenObjectSO("Tomato", 1)
    lettuce = KitchenObjectSO("Lettuce", 2)
    bread = KitchenObjectSO("Bread", 3)
    cheese = KitchenObjectSO("Cheese", 4)
    
    # サンプルレシピ
    sandwich_recipe = RecipeSO("Sandwich", [bread, lettuce, tomato])
    salad_recipe = RecipeSO("Salad", [lettuce, tomato])
    cheese_sandwich_recipe = RecipeSO("Cheese Sandwich", [bread, cheese, lettuce])
    
    recipe_list = RecipeListSO([sandwich_recipe, salad_recipe, cheese_sandwich_recipe])
    
    # ゲームマネージャーとデリバリーマネージャーを初期化
    game_manager = KitchenGameManager.get_instance()
    delivery_manager = DeliveryManager.get_instance(recipe_list)
    
    # イベントハンドラーの設定
    def on_recipe_spawned(sender, args):
        event = {
            'type': 'recipe_spawned',
            'timestamp': time.time(),
            'message': '新しいレシピが生成されました！',
            'waiting_recipes': len(delivery_manager.get_waiting_recipe_so_list())
        }
        game_history.append(event)
        print("新しいレシピが生成されました！")
    
    def on_recipe_success(sender, args):
        event = {
            'type': 'recipe_success',
            'timestamp': time.time(),
            'message': 'レシピ配達成功！',
            'successful_count': delivery_manager.get_successful_recipes_amount()
        }
        game_history.append(event)
        print("レシピ配達成功！")
    
    def on_recipe_failed(sender, args):
        event = {
            'type': 'recipe_failed',
            'timestamp': time.time(),
            'message': 'レシピ配達失敗...'
        }
        game_history.append(event)
        print("レシピ配達失敗...")
    
    delivery_manager.on_recipe_spawned.add_handler(on_recipe_spawned)
    delivery_manager.on_recipe_success.add_handler(on_recipe_success)
    delivery_manager.on_recipe_failed.add_handler(on_recipe_failed)

@app.route('/')
def index():
    """メインページ"""
    return render_template('index.html')

@app.route('/api/game_status')
def game_status():
    """ゲームステータスのAPI"""
    if delivery_manager is None:
        return jsonify({'error': 'Game not initialized'})
    
    return jsonify({
        'is_playing': game_manager.is_game_playing(),
        'waiting_recipes': [recipe.name for recipe in delivery_manager.get_waiting_recipe_so_list()],
        'successful_recipes': delivery_manager.get_successful_recipes_amount(),
        'history': game_history[-10:]  # 最新10件の履歴
    })

@app.route('/api/start_game', methods=['POST'])
def start_game():
    """ゲーム開始API"""
    if game_manager is None:
        initialize_game()
    
    game_manager.start_game()
    return jsonify({'status': 'Game started'})

@app.route('/api/stop_game', methods=['POST'])
def stop_game():
    """ゲーム停止API"""
    if game_manager:
        game_manager.stop_game()
    return jsonify({'status': 'Game stopped'})

@app.route('/api/deliver_recipe', methods=['POST'])
def deliver_recipe():
    """レシピ配達API"""
    if delivery_manager is None:
        return jsonify({'error': 'Game not initialized'})
    
    data = request.get_json()
    ingredients = data.get('ingredients', [])
    
    # 材料を皿に追加
    plate = PlateKitchenObject()
    for ingredient_name in ingredients:
        # 材料名から対応するKitchenObjectSOを作成
        ingredient_id = {'Tomato': 1, 'Lettuce': 2, 'Bread': 3, 'Cheese': 4}.get(ingredient_name, 0)
        if ingredient_id > 0:
            plate.add_kitchen_object(KitchenObjectSO(ingredient_name, ingredient_id))
    
    # レシピ配達を試行
    delivery_manager.deliver_recipe(plate)
    
    return jsonify({'status': 'Recipe delivered'})

@app.route('/api/update')
def update_game():
    """ゲームアップデートAPI"""
    if delivery_manager:
        delivery_manager.update()
    return jsonify({'status': 'Updated'})

if __name__ == '__main__':
    initialize_game()
    # Debug mode disabled for security in production
    app.run(debug=False, host='0.0.0.0', port=5000)