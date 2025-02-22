import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const response = await axios.get('http://localhost:5050/api/messages');
      res.status(200).json(response.data);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching messages', error: error.toString() });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
