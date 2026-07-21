# Modals Directory

This directory contains all reusable modal components used throughout the application.

## Structure

```
modals/
├── index.js                 # Central export file for easy imports
├── JobDetailsModal.jsx      # Job details display modal
├── ApplyModal.jsx          # Slide-in application form panel
└── README.md               # This file
```

## Usage

### Import from index (Recommended)
```javascript
import { JobDetailsModal, ApplyModal } from '../../modals';
```

### Direct import
```javascript
import JobDetailsModal from '../../modals/JobDetailsModal';
import ApplyModal from '../../modals/ApplyModal';
```

## Available Modals

### JobDetailsModal
Displays detailed job posting information with sections for description, qualifications, and requirements.

**Props:**
- `open` (boolean) - Controls modal visibility
- `job` (object) - Job posting data
- `onClose` (function) - Callback when modal closes
- `onApply` (function) - Callback when user clicks apply
- `parseAdditionalInfo` (function) - Parses additional job information

**Example:**
```javascript
<JobDetailsModal
  open={showModal}
  job={selectedJob}
  onClose={() => setShowModal(false)}
  onApply={handleApply}
  parseAdditionalInfo={parseInfo}
/>
```

### ApplyModal
Slide-in panel from the right that displays the full job application form with resume upload, AI parsing, and form validation.

**Props:**
- `open` (boolean) - Controls panel visibility
- `job` (object) - Job posting data (contains job title, department, etc.)
- `onClose` (function) - Callback when panel closes

**Features:**
- ✨ Smooth slide-left animation
- 📄 Resume upload with AI parsing
- ✅ Form validation with error messages
- 🎉 Success screen after submission
- 📱 Fully responsive

**Example:**
```javascript
<ApplyModal
  open={showApplyModal}
  job={selectedJob}
  onClose={() => setShowApplyModal(false)}
/>
```

## Guidelines

1. **Keep modals focused** - Each modal should handle a single purpose
2. **Use semantic naming** - Name modals after their primary function
3. **Document props** - Add JSDoc comments for all props
4. **Export from index** - Always add new modals to index.js
5. **Reusable logic** - Extract common modal logic into hooks or utilities
6. **Animations** - Use consistent transition durations (300-500ms)

## Adding New Modals

1. Create your modal component file (e.g., `ConfirmationModal.jsx`)
2. Add proper JSDoc documentation
3. Export it from `index.js`
4. Update this README with usage examples
