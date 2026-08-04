import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="empty-state" style={{ padding: '80px 20px' }}>
          Something went wrong loading the page. Please refresh — if it keeps happening,
          check the browser console (F12) for the error and share it so it can be fixed.
        </div>
      );
    }
    return this.props.children;
  }
}
