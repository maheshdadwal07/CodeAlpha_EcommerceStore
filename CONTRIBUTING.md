# Contributing to ShopEase

First off, thank you for considering contributing to ShopEase! 🎉

## How Can I Contribute?

### Reporting Bugs 🐛

Before creating bug reports, please check existing issues. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if possible**
- **Include your environment details** (OS, Node version, MongoDB version)

### Suggesting Enhancements 💡

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List some examples of how it would work**

### Pull Requests 🔨

1. **Fork the repository**
2. **Create a new branch** (`git checkout -b feature/AmazingFeature`)
3. **Make your changes**
4. **Test your changes thoroughly**
5. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
6. **Push to the branch** (`git push origin feature/AmazingFeature`)
7. **Open a Pull Request**

## Development Setup

1. Clone your fork:

   ```bash
   git clone https://github.com/YOUR-USERNAME/shopease-ecommerce.git
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up MongoDB and seed the database:

   ```bash
   npm run seed
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Code Style Guidelines

### JavaScript

- Use ES6+ features
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused
- Use async/await instead of callbacks

### CSS

- Use BEM naming convention where appropriate
- Keep selectors specific but not overly complex
- Use CSS variables for colors and common values
- Mobile-first responsive design
- Add comments for sections

### HTML

- Use semantic HTML5 elements
- Keep markup clean and readable
- Add proper ARIA labels for accessibility
- Use meaningful class names

## Project Structure

```
shopease-ecommerce/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── public/          # Frontend files
│   ├── css/        # Stylesheets
│   ├── js/         # JavaScript files
│   └── *.html      # HTML pages
├── seed.js         # Database seeding
└── server.js       # Express server
```

## Testing

Before submitting a pull request:

1. Test all functionality manually
2. Test on different screen sizes (mobile, tablet, desktop)
3. Test on different browsers (Chrome, Firefox, Safari, Edge)
4. Check for console errors
5. Verify MongoDB operations work correctly

## Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests after the first line

Examples:

```
Add user profile page
Fix navbar overflow on iPad
Update product card hover effects
Refactor cart calculation logic
```

## Feature Requests Priority

High Priority:

- Bug fixes
- Security improvements
- Performance optimizations
- Mobile responsiveness issues

Medium Priority:

- New features that enhance core functionality
- UI/UX improvements
- Better error handling

Low Priority:

- Nice-to-have features
- Minor UI tweaks
- Code refactoring (without functionality changes)

## Need Help?

Feel free to:

- Open an issue with the "question" label
- Reach out to the maintainers
- Check existing documentation

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards other contributors

Thank you for contributing! 🙏
