import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import axios from 'axios';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState({
    messages: 0,
    meetings: 0
  });
  const { user } = useAuth();

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Helper function to show browser notification
  const showBrowserNotification = (title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
      
      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
      
      return notification;
    }
  };

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const newSocket = io('http://localhost:3000');
      
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        
        // Join user's personal room
        newSocket.emit('join', user._id);
        
        // Fetch initial notification counts when user connects
        fetchInitialNotificationCounts();
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      // Listen for notification updates
      newSocket.on('notification_update', (data) => {
        console.log('Socket notification update received:', data);
        if (data.type && typeof data.count === 'number') {
          setNotificationCounts(prev => ({
            ...prev,
            [data.type]: data.count
          }));
        }
      });

      // Listen for new messages with enhanced notifications
      newSocket.on('new_message', (data) => {
        console.log('🔔 New message received globally:', data);
        
        // Show system notification if user receives a message
        if (data.message && data.message.receiver === user._id) {
          const senderName = data.message.sender.name;
          const messageContent = data.message.content;
          
          console.log(`📨 New message from ${senderName}: ${messageContent}`);
          
          // Update global badge count immediately
          setNotificationCounts(prev => {
            const newCount = prev.messages + 1;
            console.log('📊 Updating message count:', prev.messages, '→', newCount);
            return {
              ...prev,
              messages: newCount
            };
          });
          
          // Show browser notification if user is not actively on the page
          if (document.hidden || !document.hasFocus()) {
            showBrowserNotification(`📨 New message from ${senderName}`, {
              body: messageContent,
              tag: `message-${data.message.sender.id}`, // Prevent duplicate notifications
              requireInteraction: false
            });
          }
          
          // Refresh notification counts from backend after a short delay
          setTimeout(async () => {
            try {
              const response = await axios.get('/api/notifications/counts');
              console.log('🔄 Syncing notification counts from backend:', response.data);
              setNotificationCounts(response.data);
            } catch (error) {
              console.error('❌ Error syncing notification counts:', error);
            }
          }, 1000);
        }
      });

      // Listen for meeting requests with enhanced notifications
      newSocket.on('meeting_request', (data) => {
        console.log('📅 Meeting request received:', data);
        
        if (data.meeting && data.meeting.participant === user._id) {
          // Update meeting notification count
          setNotificationCounts(prev => {
            const newCount = prev.meetings + 1;
            console.log('📊 Updating meeting count:', prev.meetings, '→', newCount);
            return {
              ...prev,
              meetings: newCount
            };
          });
          
          // Show browser notification
          const initiatorName = data.meeting.initiator?.name || 'Someone';
          showBrowserNotification(`📅 New meeting request from ${initiatorName}`, {
            body: `${initiatorName} wants to schedule: ${data.meeting.title}`,
            tag: `meeting-${data.meeting.id}`,
            requireInteraction: true
          });
          
          // Sync with backend after short delay
          setTimeout(async () => {
            try {
              const response = await axios.get('/api/notifications/counts');
              setNotificationCounts(response.data);
            } catch (error) {
              console.error('❌ Error syncing meeting counts:', error);
            }
          }, 1000);
        }
      });

      // Listen for meeting status updates with count synchronization
      newSocket.on('meeting_accepted', (data) => {
        console.log('✅ Meeting accepted:', data);
        // Refresh counts from backend since meeting status changed
        setTimeout(() => fetchInitialNotificationCounts(), 500);
      });

      newSocket.on('meeting_declined', (data) => {
        console.log('❌ Meeting declined:', data);
        // Refresh counts from backend since meeting status changed
        setTimeout(() => fetchInitialNotificationCounts(), 500);
      });

      newSocket.on('meeting_cancelled', (data) => {
        console.log('🚫 Meeting cancelled:', data);
        // Refresh counts from backend since meeting status changed
        setTimeout(() => fetchInitialNotificationCounts(), 500);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      // User is not logged in, close socket if exists
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
        setNotificationCounts({ messages: 0, meetings: 0 });
      }
    }
  }, [user]);

  const fetchInitialNotificationCounts = async () => {
    try {
      console.log('🔍 Fetching initial notification counts for user:', user?.name);
      const response = await axios.get('/api/notifications/counts');
      console.log('📊 Initial notification counts loaded:', response.data);
      
      const counts = {
        messages: response.data.messages || 0,
        meetings: response.data.meetings || 0
      };
      
      console.log('🔄 Setting notification counts:', counts);
      setNotificationCounts(counts);
    } catch (error) {
      console.error('❌ Error fetching initial notification counts:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Set defaults on error
      setNotificationCounts({ messages: 0, meetings: 0 });
    }
  };

  const updateNotificationCount = (type, count) => {
    setNotificationCounts(prev => ({
      ...prev,
      [type]: count
    }));
  };

  const value = {
    socket,
    isConnected,
    notificationCounts,
    updateNotificationCount
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};