
import { test, expect } from '@playwright/test';

test('should allow commenting with mentions and display them correctly', async ({ page }) => {
  // Mock authentication (assuming a way to log in or set session)
  // For a real E2E test, you'd navigate to login and perform login actions
  // For simplicity, we'll assume the user is already logged in or mock the session.
  // await page.goto('/login');
  // await page.fill('input[name="email"]', 'test@example.com');
  // await page.fill('input[name="password"]', 'password');
  // await page.click('button[type="submit"]');
  // await page.waitForURL('/dashboard');

  // Navigate to a project or task detail page where comments are enabled
  await page.goto('/internal/projects/clx0123456789abcdefghijklm'); // Replace with a valid project/task ID

  // Ensure the comment section is visible
  await expect(page.getByText('Comments')).toBeVisible();

  // Mock the API call for user suggestions
  await page.route('/api/users?query=*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'user1', name: 'John Doe', email: 'john@example.com' },
        { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
      ]),
    });
  });

  // Type a comment with a mention
  await page.locator('.mentions-input').fill('Hey @');
  await page.locator('.mentions-input').type('John');

  // Select the mentioned user from the suggestion list
  await page.waitForSelector('.mention-suggestion');
  await page.click('.mention-suggestion:has-text("John Doe")');

  // Continue typing the comment
  await page.locator('.mentions-input').type(' check this out!');

  // Submit the comment
  await page.click('button:has-text("Add Comment")');

  // Verify the comment is displayed with the mention styled correctly
  await expect(page.locator('.text-blue-500.font-semibold')).toBeVisible();
  await expect(page.locator('.text-blue-500.font-semibold')).toHaveText('@John Doe');
  await expect(page.getByText('Hey @John Doe check this out!')).toBeVisible();

  // Verify a notification is created (this would typically involve checking the notifications UI or DB)
  // For this E2E test, we'll just check for a success message or a change in UI that implies success.
  // A more robust test would involve navigating to the notifications page and asserting the notification content.
  console.log('Comment with mention added and displayed successfully.');
});
