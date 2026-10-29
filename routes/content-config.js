module.exports = {
    skills: {
        Model: require('../models/Skill'),
        singular: 'Skill',
        plural: 'Skills',
        columns: [{ key: 'name', label: 'Name' }],
        fields: [
            { name: 'name', label: 'Skill name', type: 'text', required: true, max: 40 },
            {
                name: 'image', label: 'Icon', type: 'image', required: true,
                help: 'Upload a PNG, JPG or WEBP, or paste an image link (for SVG icons use a link, for example from devicon).'
            },
            { name: 'order', label: 'Order', type: 'number', help: 'Smaller numbers appear first.' },
        ],
    },

    projects: {
        Model: require('../models/Project'),
        singular: 'Project',
        plural: 'Projects',
        columns: [
            { key: 'title', label: 'Title' },
            { key: 'techStack', label: 'Tech stack' },
        ],
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true, max: 80 },
            { name: 'description', label: 'Description', type: 'textarea', required: true, max: 500 },
            { name: 'image', label: 'Project image', type: 'image' },
            { name: 'techStack', label: 'Tech stack', type: 'tags', help: 'Separate with commas, for example: Node.js, Express, MongoDB' },
            { name: 'liveLink', label: 'Live link', type: 'url' },
            { name: 'githubLink', label: 'GitHub link', type: 'url' },
            { name: 'order', label: 'Order', type: 'number', help: 'Smaller numbers appear first.' },
        ],
    },

    coding: {
        Model: require('../models/CodingProfile'),
        singular: 'Coding profile',
        plural: 'Coding profiles',
        columns: [
            { key: 'platform', label: 'Platform' },
            { key: 'link', label: 'Link' },
        ],
        fields: [
            { name: 'platform', label: 'Platform name', type: 'text', required: true, max: 40 },
            { name: 'image', label: 'Platform logo', type: 'image', required: true },
            { name: 'link', label: 'Profile link', type: 'url', required: true },
            { name: 'order', label: 'Order', type: 'number', help: 'Smaller numbers appear first.' },
        ],
    },

    education: {
        Model: require('../models/Education'),
        singular: 'Education',
        plural: 'Education',
        columns: [
            { key: 'degree', label: 'Degree' },
            { key: 'institute', label: 'Institute' },
            { key: 'startYear', label: 'From' },
            { key: 'endYear', label: 'To' },
        ],
        fields: [
            { name: 'degree', label: 'Degree / course', type: 'text', required: true, max: 100 },
            { name: 'institute', label: 'Institute', type: 'text', required: true, max: 100 },
            { name: 'startYear', label: 'Start year', type: 'text', required: true, max: 20 },
            { name: 'endYear', label: 'End year', type: 'text', max: 20, fallback: 'Present', help: 'Leave empty for "Present".' },
            { name: 'description', label: 'Description', type: 'textarea', max: 400 },
            { name: 'order', label: 'Order', type: 'number', help: 'Smaller numbers appear first.' },
        ],
    },

    experience: {
        Model: require('../models/Experience'),
        singular: 'Experience',
        plural: 'Experience',
        columns: [
            { key: 'role', label: 'Role' },
            { key: 'company', label: 'Company' },
            { key: 'startDate', label: 'From' },
            { key: 'endDate', label: 'To' },
        ],
        fields: [
            { name: 'role', label: 'Role', type: 'text', required: true, max: 100 },
            { name: 'company', label: 'Company', type: 'text', required: true, max: 100 },
            { name: 'startDate', label: 'Start date', type: 'text', required: true, max: 20, help: 'For example: Jun 2025' },
            { name: 'endDate', label: 'End date', type: 'text', max: 20, fallback: 'Present', help: 'Leave empty for "Present".' },
            { name: 'description', label: 'Description', type: 'textarea', max: 400 },
            { name: 'order', label: 'Order', type: 'number', help: 'Smaller numbers appear first.' },
        ],
    },
};