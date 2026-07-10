import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PkIcon } from 'ngx-pk-ui';
import { ThemeService } from '../../services/theme.service';

interface Conversation {
  id: string;
  topic: string;
}

@Component({
  selector: 'app-ai-prompt',
  imports: [NgOptimizedImage, FormsModule, PkIcon],
  templateUrl: './ai-prompt.html',
  styleUrl: './ai-prompt.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPrompt {
  themeService = inject(ThemeService);
  sidebarCollapsed = signal(false);
  conversations = signal<Conversation[]>([]);
  activeId = signal<string | null>(null);

  topicInput = signal('');
  prompt = signal('');
  submittedPrompt = signal('');
  isLoading = signal(false);
  response = signal<string | null>(null);

  isTopicPhase = computed(() => this.activeId() === null);
  activeTopic = computed(
    () => this.conversations().find((c) => c.id === this.activeId())?.topic ?? null
  );

  onSetTopic(): void {
    if (!this.topicInput().trim()) return;
    const id = Date.now().toString();
    this.conversations.update((c) => [...c, { id, topic: this.topicInput().trim() }]);
    this.activeId.set(id);
    this.topicInput.set('');
    this.prompt.set('');
    this.submittedPrompt.set('');
    this.response.set(null);
  }

  onNewChat(): void {
    this.activeId.set(null);
    this.topicInput.set('');
    this.prompt.set('');
    this.submittedPrompt.set('');
    this.response.set(null);
  }

  selectConversation(id: string): void {
    this.activeId.set(id);
    this.prompt.set('');
    this.submittedPrompt.set('');
    this.response.set(null);
  }

  onSubmit(): void {
    if (!this.prompt().trim() || this.isLoading()) return;
    this.submittedPrompt.set(this.prompt());
    this.isLoading.set(true);
    this.response.set(null);
    // TODO: call AI API
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  onTopicKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSetTopic();
    }
  }
}
