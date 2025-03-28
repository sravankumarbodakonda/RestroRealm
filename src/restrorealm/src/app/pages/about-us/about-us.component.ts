import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about-us',
  standalone: true,
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.css'],
  imports: [
    CommonModule,
    RouterModule
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class AboutUsComponent implements OnInit {
  
  teamMembers = [
    {
      name: 'Sravan Kumar Bodakonda',
      position: 'Executive Chef & Co-Founder',
      bio: 'With over 15 years of culinary experience across three continents, Chef Sravan brings innovative techniques and global influences to every dish at RestroRealm.',
      imageUrl: 'https://img.freepik.com/premium-photo/wide-angle-shot-single-tree-growing-clouded-sky-sunset-surrounded-by-grass_181624-22807.jpg'
    },
    {
      name: 'Indraneel',
      position: 'Restaurateur & Co-Founder',
      bio: 'Indraneel combines his business acumen with his passion for hospitality to create memorable dining experiences that keep guests coming back.',
      imageUrl: 'https://greggvanourek.com/wp-content/uploads/2023/08/Nature-path-by-water-trees-and-mountains-AdobeStock_291242770-scaled.jpeg'
    },
    {
      name: 'Ajay',
      position: 'Sous Chef',
      bio: 'Ajay\'s attention to detail and creativity make her an invaluable part of our culinary team, specializing in innovative desserts and pastries.',
      imageUrl: 'https://img.freepik.com/premium-photo/wide-angle-shot-single-tree-growing-clouded-sky-sunset-surrounded-by-grass_181624-22807.jpg'
    },
    {
      name: 'Latha',
      position: 'Beverage Director',
      bio: 'Latha curates our award-winning wine list and crafts signature cocktails that perfectly complement our menu offerings.',
      imageUrl: 'https://static.vecteezy.com/system/resources/thumbnails/024/669/489/small_2x/mountain-countryside-landscape-at-sunset-dramatic-sky-over-a-distant-valley-green-fields-and-trees-on-hill-beautiful-natural-landscapes-of-the-carpathians-generative-ai-variation-5-photo.jpeg'
    }
  ];

  milestones = [
    { year: '2018', event: 'RestroRealm founded by Maria Chen and James Wilson' },
    { year: '2019', event: 'Earned "Best New Restaurant" award in the city' },
    { year: '2020', event: 'Launched sustainable sourcing initiative with local farms' },
    { year: '2021', event: 'Expanded dining room and added private event space' },
    { year: '2022', event: 'Featured in National Culinary Magazine\'s "Top 50 Restaurants"' },
    { year: '2023', event: 'Celebrated 5-year anniversary with special tasting menu' },
    { year: '2024', event: 'Opened outdoor garden dining area' }
  ];

  constructor() { }

  ngOnInit(): void {
    // window.scrollTo(0, 0);
  }
}
