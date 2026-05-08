import { createRouter } from 'sv-router';
import Main from './Main.svelte';
import Create from './create/Create.svelte';

export const { p, navigate, isActive, route } = createRouter({
    '/kaizo': Create,
    '/:id': Main,
});
