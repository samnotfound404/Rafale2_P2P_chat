import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { target_ip, target_port, message } = req.body;
    try {
      const response = await axios.post('http://localhost:5050/api/send', {
        target_ip,
        target_port,
        message,
      });
      res.status(200).json(response.data);
    } catch (error) {
      res.status(500).json({ message: 'Error sending message', error: error.toString() });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
