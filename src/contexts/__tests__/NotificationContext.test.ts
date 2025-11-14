import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { NotificationProvider, useNotification } from '@/contexts/NotificationContext';
import React from 'react';

describe('NotificationContext', () => {
  describe('useNotification hook', () => {
    it('should initialize with empty notifications', () => {
      const wrapper = (props: { children: React.ReactNode }) =>
        React.createElement(NotificationProvider, props);

      const { result } = renderHook(() => useNotification(), { wrapper });

      expect(result.current.notifications).toEqual([]);
    });

    it('should add success notification', () => {
      const wrapper = (props: { children: React.ReactNode }) =>
        React.createElement(NotificationProvider, props);

      const { result } = renderHook(() => useNotification(), { wrapper });

      act(() => {
        result.current.success('Success', 'Operation completed');
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toMatchObject({
        type: 'success',
        title: 'Success',
        message: 'Operation completed',
      });
    });

    it('should add error notification', () => {
      const wrapper = (props: { children: React.ReactNode }) =>
        React.createElement(NotificationProvider, props);

      const { result } = renderHook(() => useNotification(), { wrapper });

      act(() => {
        result.current.error('Error', 'Something went wrong');
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toMatchObject({
        type: 'error',
        title: 'Error',
        message: 'Something went wrong',
      });
    });

    it('should add warning notification', () => {
      const wrapper = (props: { children: React.ReactNode }) =>
        React.createElement(NotificationProvider, props);

      const { result } = renderHook(() => useNotification(), { wrapper });

      act(() => {
        result.current.warning('Warning', 'Be careful');
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toMatchObject({
        type: 'warning',
        title: 'Warning',
        message: 'Be careful',
      });
    });

    it('should add info notification', () => {
      const wrapper = (props: { children: React.ReactNode }) =>
        React.createElement(NotificationProvider, props);

      const { result } = renderHook(() => useNotification(), { wrapper });

      act(() => {
        result.current.info('Info', 'Some information');
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toMatchObject({
        type: 'info',
        title: 'Info',
        message: 'Some information',
      });
    });

    it('should dismiss notification by id', () => {
      const wrapper = (props: { children: React.ReactNode }) =>
        React.createElement(NotificationProvider, props);

      const { result } = renderHook(() => useNotification(), { wrapper });

      let notificationId = '';
      act(() => {
        notificationId = result.current.success('Success', 'Message');
      });

      expect(result.current.notifications).toHaveLength(1);

      act(() => {
        result.current.dismiss(notificationId);
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should dismiss all notifications', () => {
      const wrapper = (props: { children: React.ReactNode }) =>
        React.createElement(NotificationProvider, props);

      const { result } = renderHook(() => useNotification(), { wrapper });

      act(() => {
        result.current.success('Success 1', 'Message 1');
        result.current.error('Error 1', 'Message 2');
        result.current.warning('Warning 1', 'Message 3');
      });

      expect(result.current.notifications).toHaveLength(3);

      act(() => {
        result.current.dismissAll();
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should return notification id from show method', () => {
      const wrapper = (props: { children: React.ReactNode }) =>
        React.createElement(NotificationProvider, props);

      const { result } = renderHook(() => useNotification(), { wrapper });

      let id = '';
      act(() => {
        id = result.current.show({
          type: 'success',
          title: 'Test',
          message: 'Message',
        });
      });

      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
      expect(id).toContain('notif-');
    });

    it('should set default duration if not provided', () => {
      const wrapper = (props: { children: React.ReactNode }) =>
        React.createElement(NotificationProvider, props);

      const { result } = renderHook(() => useNotification(), { wrapper });

      act(() => {
        result.current.success('Success', 'Message');
      });

      expect(result.current.notifications[0].duration).toBe(5000);
    });

    it('should respect custom duration', () => {
      const wrapper = (props: { children: React.ReactNode }) =>
        React.createElement(NotificationProvider, props);

      const { result } = renderHook(() => useNotification(), { wrapper });

      act(() => {
        result.current.success('Success', 'Message', 10000);
      });

      expect(result.current.notifications[0].duration).toBe(10000);
    });

    it('should allow infinite duration', () => {
      const wrapper = (props: { children: React.ReactNode }) =>
        React.createElement(NotificationProvider, props);

      const { result } = renderHook(() => useNotification(), { wrapper });

      act(() => {
        result.current.show({
          type: 'info',
          title: 'Info',
          message: 'Message',
          duration: Infinity,
        });
      });

      expect(result.current.notifications[0].duration).toBe(Infinity);
    });

    it('should throw error if used outside provider', () => {
      expect(() => {
        renderHook(() => useNotification());
      }).toThrow('useNotification must be used within NotificationProvider');
    });

    it('should add notification with action', () => {
      const wrapper = (props: { children: React.ReactNode }) =>
        React.createElement(NotificationProvider, props);

      const { result } = renderHook(() => useNotification(), { wrapper });

      const action = { label: 'Undo', onClick: vi.fn() };

      act(() => {
        result.current.show({
          type: 'success',
          title: 'Success',
          message: 'Message',
          action,
        });
      });

      expect(result.current.notifications[0].action).toEqual(action);
    });

    it('should support multiple notifications simultaneously', () => {
      const wrapper = (props: { children: React.ReactNode }) =>
        React.createElement(NotificationProvider, props);

      const { result } = renderHook(() => useNotification(), { wrapper });

      act(() => {
        result.current.success('Success 1', 'Message 1');
        result.current.error('Error 1', 'Message 2');
        result.current.warning('Warning 1', 'Message 3');
        result.current.info('Info 1', 'Message 4');
      });

      expect(result.current.notifications).toHaveLength(4);
      expect(result.current.notifications[0].type).toBe('success');
      expect(result.current.notifications[1].type).toBe('error');
      expect(result.current.notifications[2].type).toBe('warning');
      expect(result.current.notifications[3].type).toBe('info');
    });
  });
});
