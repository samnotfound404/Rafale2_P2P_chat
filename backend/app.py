from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import socket

app = Flask(__name__)
CORS(app)  # Allow requests from the frontend

# Global variables
active_peers = {}
received_messages = []  # List to store incoming messages
socket_port = None  # This will be set at startup (socket server port)
server_socket = None

# --- Socket Functions ---

def receive_messages():
    """Run in a background thread to listen for incoming connections."""
    global server_socket, received_messages
    while True:
        try:
            client_socket, client_address = server_socket.accept()
            peer_ip, peer_port = client_address
            message = client_socket.recv(1024).decode().strip()
            if message == "Connection Request":
                print(f"Received CONNECTION REQUEST from {peer_ip}:{peer_port}")
                active_peers[(peer_ip, peer_port)] = "Connected"
                client_socket.sendall("Connection Acknowledged".encode())
            elif message == "Connection Acknowledged":
                print(f"Received CONNECTION ACKNOWLEDGED from {peer_ip}:{peer_port}")
                active_peers[(peer_ip, peer_port)] = "Connected"
            else:
                print(f"Received message from {peer_ip}:{peer_port} : {message}")
                active_peers[(peer_ip, peer_port)] = "Connected"
                # Save the incoming message along with sender info
                received_messages.append({
                    "from": f"{peer_ip}:{peer_port}",
                    "message": message
                })
            client_socket.close()
        except Exception as e:
            print(f"Error receiving message: {e}")

def send_message(target_ip, target_port, message):
    global socket_port
    try:
        client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        client_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

        # Bind the sender socket to a fixed port (socket_port)
        client_socket.bind(("0.0.0.0", socket_port))

        client_socket.connect((target_ip, target_port))
        client_socket.sendall(message.encode())

        if message == "Connection Request":
            ack = client_socket.recv(1024).decode().strip()
            if ack == "Connection Acknowledged":
                print(f"Received acknowledgment from {target_ip}:{target_port}")
                active_peers[(target_ip, target_port)] = "Connected"

        client_socket.close()
        print(f"Message sent to {target_ip}:{target_port} from {socket_port}")
        return {"status": "success", "message": f"Message sent to {target_ip}:{target_port} from {socket_port}"}
    except Exception as e:
        err_msg = f"Failed to send message to {target_ip}:{target_port} - {e}"
        print(err_msg)
        return {"status": "error", "message": err_msg}

# --- API Endpoints --- 

@app.route('/api/send', methods=['POST'])
def api_send_message():
    data = request.json
    target_ip = data.get('target_ip')
    target_port = int(data.get('target_port'))
    message = data.get('message')
    result = send_message(target_ip, target_port, message)
    return jsonify(result)

@app.route('/api/query', methods=['GET'])
def api_query_peers():
    peers = {f"{ip}:{port}": status for (ip, port), status in active_peers.items()}
    return jsonify(peers)

@app.route('/api/connect', methods=['POST'])
def api_connect():
    data = request.json
    target_ip = data.get('target_ip')
    target_port = int(data.get('target_port'))
    result = send_message(target_ip, target_port, "Connection Request")
    return jsonify(result)

@app.route('/api/disconnect', methods=['POST'])
def api_disconnect():
    data = request.json
    disconnect_ip = data.get('disconnect_ip')
    disconnect_port = int(data.get('disconnect_port'))
    key = (disconnect_ip, disconnect_port)
    if key in active_peers:
        del active_peers[key]
        return jsonify({"status": "success", "message": f"Disconnected from {disconnect_ip}:{disconnect_port}"})
    else:
        return jsonify({"status": "error", "message": "Peer not found"}), 404

@app.route('/api/messages', methods=['GET'])
def api_get_messages():
    # Return all received messages.
    return jsonify(received_messages)

# --- Start the Socket Server ---
def start_socket_server(fixed_port):
    global socket_port, server_socket
    socket_port = fixed_port
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
    except Exception:
        pass
    server_socket.bind(("0.0.0.0", socket_port))
    server_socket.listen(5)
    print(f"Socket server listening on port {socket_port}...")
    threading.Thread(target=receive_messages, daemon=True).start()

if __name__ == '__main__':
    # Ask only for the socket server port (P2P messaging port).
    # NOTE: Avoid using very low ports (like 2) since they are often reserved or in use.
    user_socket_port = int(input("Enter your socket server port (for P2P messaging): "))
    api_port_needed = int(input("Enter flask api: "))
    # Fixed API port for HTTP requests (adjust if 5050 is unavailable)
    fixed_api_port = api_port_needed  
    start_socket_server(user_socket_port)
    
    # If you get "Address already in use" here, it means port 5050 is taken.
    # You can either free that port or change fixed_api_port to an available port.
    app.run(host='0.0.0.0', port=fixed_api_port)
