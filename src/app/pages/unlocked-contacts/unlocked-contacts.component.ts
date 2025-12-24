import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../services/contact.service';

@Component({
  selector: 'app-unlocked-contacts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unlocked-contacts.component.html',
  styleUrls: ['./unlocked-contacts.component.scss']
})
export class UnlockedContactsComponent implements OnInit {

  loading = true;
  contacts: any[] = [];
  error = '';

    constructor(private contactService: ContactService) {}



  ngOnInit(): void {
    this.contactService.getUnlockedContacts().subscribe({
      next: res => {
        this.contacts = res;
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.error = 'Failed to load unlocked contacts';
        this.loading = false;
      }
    });
  }
}
